import crypto from 'crypto';
import {
  Agent,
  AgentResult,
  DocumentCompletenessAgent,
  IdentityConsistencyAgent,
  RiskIndicatorAgent,
  RecommendationAgent,
  RecommendationAgentResult,
} from '../agents/index.js';
import { CaseRepository, AgentRunRepository, AgentFindingRepository, CaseReviewRepository } from '../models/index.js';
import { OnboardingCase } from '../types/index.js';
import {
  WorkflowStatus,
  AutonomyMode,
  WorkflowStep,
  CaseReviewRecord,
} from './types.js';

export class OnboardingOrchestrator {
  private documentCompletenessAgent: DocumentCompletenessAgent;
  private identityConsistencyAgent: IdentityConsistencyAgent;
  private riskIndicatorAgent: RiskIndicatorAgent;
  private recommendationAgent: RecommendationAgent;

  constructor() {
    this.documentCompletenessAgent = new DocumentCompletenessAgent();
    this.identityConsistencyAgent = new IdentityConsistencyAgent();
    this.riskIndicatorAgent = new RiskIndicatorAgent();
    this.recommendationAgent = new RecommendationAgent();
  }

  /**
   * Controlled execution wrapper with maximum 2 total attempts (1 initial + 1 retry).
   * Catches errors, manages retries, logs steps, and guarantees a typed AgentResult.
   */
  private async executeAgentWithRetry<TInput, TOutput extends AgentResult>(
    agent: Agent<TInput, TOutput>,
    input: TInput,
    stepNumber: number,
    caseId: string,
    reviewId: string,
    executionTrace: WorkflowStep[]
  ): Promise<TOutput> {
    const startedAt = new Date().toISOString();
    let retryCount = 0;
    let lastError: string | undefined;

    // Up to 2 total attempts
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await agent.execute(input);

        // If the agent reported execution failure internally
        if (result.status === 'FAILED') {
          throw new Error(result.failureReason || `${agent.name} returned FAILED status`);
        }

        const completedAt = new Date().toISOString();
        const step: WorkflowStep = {
          step: stepNumber,
          agent: agent.name,
          status: 'COMPLETED',
          startedAt,
          completedAt,
          retryCount,
        };
        executionTrace.push(step);

        // Record in SQLite database
        this.recordAgentRun(reviewId, caseId, stepNumber, result, retryCount);

        return result;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < 2) {
          retryCount++;
          // Brief pause before retry
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
    }

    // Both attempts failed: create typed failure result
    const completedAt = new Date().toISOString();
    const failedStep: WorkflowStep = {
      step: stepNumber,
      agent: agent.name,
      status: 'FAILED',
      startedAt,
      completedAt,
      retryCount,
      error: lastError,
    };
    executionTrace.push(failedStep);

    const failureResult: AgentResult = {
      agentName: agent.name,
      status: 'FAILED',
      findings: [
        {
          code: 'AGENT_ORCHESTRATION_FAILURE',
          severity: 'HIGH',
          message: `Specialist agent ${agent.name} failed after ${retryCount + 1} attempt(s): ${lastError}`,
          evidence: [lastError || 'Unknown error'],
        },
      ],
      confidence: 0,
      summary: `Failed execution in ${agent.name}. Error: ${lastError}`,
      startedAt,
      completedAt,
      failureReason: lastError,
    };

    // Record failed run in DB
    this.recordAgentRun(reviewId, caseId, stepNumber, failureResult, retryCount, lastError);

    return failureResult as TOutput;
  }

  /**
   * Persists agent run and individual findings into SQLite tables
   */
  private recordAgentRun(
    reviewId: string,
    caseId: string,
    step: number,
    result: AgentResult,
    retryCount: number,
    error?: string
  ): void {
    const runId = `run-${crypto.randomUUID()}`;

    AgentRunRepository.create({
      id: runId,
      caseId,
      agentName: result.agentName,
      status: result.status,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      summary: result.summary,
      reviewId,
      step,
      retryCount,
      error,
    });

    for (const finding of result.findings || []) {
      AgentFindingRepository.create({
        id: `finding-${crypto.randomUUID()}`,
        runId,
        caseId,
        agentName: result.agentName,
        severity: finding.severity,
        category: finding.code,
        description: finding.message,
        passed: finding.severity === 'INFO',
        createdAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Main supervisor review workflow orchestrator
   */
  public async executeReview(
    caseId: string,
    autonomyMode: AutonomyMode = 'EXCEPTION_ONLY'
  ): Promise<CaseReviewRecord> {
    const createdAt = new Date().toISOString();
    const reviewId = `rev-${crypto.randomUUID()}`;
    const executionTrace: WorkflowStep[] = [];

    // 1. Load Onboarding Case
    const onboardingCase = CaseRepository.findById(caseId);
    if (!onboardingCase) {
      throw new Error(`Onboarding case with ID '${caseId}' not found.`);
    }

    // 2. Execute Specialist Agents with controlled retry wrapper
    const specialistResults: AgentResult[] = [];

    // Step 1: DocumentCompletenessAgent
    const docResult = await this.executeAgentWithRetry(
      this.documentCompletenessAgent,
      onboardingCase,
      1,
      caseId,
      reviewId,
      executionTrace
    );
    specialistResults.push(docResult);

    // Step 2: IdentityConsistencyAgent
    const identityResult = await this.executeAgentWithRetry(
      this.identityConsistencyAgent,
      onboardingCase,
      2,
      caseId,
      reviewId,
      executionTrace
    );
    specialistResults.push(identityResult);

    // Step 3: RiskIndicatorAgent
    const riskResult = await this.executeAgentWithRetry(
      this.riskIndicatorAgent,
      onboardingCase,
      3,
      caseId,
      reviewId,
      executionTrace
    );
    specialistResults.push(riskResult);

    // Step 4: RecommendationAgent (Consolidates specialist findings)
    const recommendationResult = await this.executeAgentWithRetry(
      this.recommendationAgent,
      {
        onboardingCase,
        specialistResults,
      },
      4,
      caseId,
      reviewId,
      executionTrace
    );

    // 3. Evaluate Autonomy-Mode Policy
    const anySpecialistFailed = specialistResults.some((r) => r.status === 'FAILED');
    const allFindings = specialistResults.flatMap((r) => r.findings || []);
    const hasHighOrCriticalFindings = allFindings.some(
      (f) => f.severity === 'HIGH' || f.severity === 'CRITICAL'
    );

    let workflowStatus: WorkflowStatus;

    if (autonomyMode === 'HUMAN_APPROVAL_REQUIRED') {
      // Every recommendation ends in WAITING_FOR_HUMAN until a human confirms it
      workflowStatus = 'WAITING_FOR_HUMAN';
    } else {
      // EXCEPTION_ONLY
      if (
        recommendationResult.recommendation === 'APPROVE' &&
        !hasHighOrCriticalFindings &&
        !anySpecialistFailed
      ) {
        // Clean approval with zero exceptions automatically completes
        workflowStatus = 'COMPLETED';
      } else {
        // Any exception, review requirement, rejection, or failed specialist halts for human sign-off
        workflowStatus = 'WAITING_FOR_HUMAN';
      }
    }

    const completedAt = new Date().toISOString();

    const reviewRecord: CaseReviewRecord = {
      reviewId,
      caseId,
      workflowStatus,
      autonomyMode,
      agentResults: specialistResults,
      recommendation: recommendationResult,
      executionTrace,
      createdAt,
      completedAt,
    };

    // 4. Persist review record in SQLite
    CaseReviewRepository.create(reviewRecord);

    return reviewRecord;
  }

  /**
   * Retrieves a previously executed review audit record by review ID
   */
  public getReviewById(reviewId: string): CaseReviewRecord | null {
    return CaseReviewRepository.findById(reviewId);
  }
}
