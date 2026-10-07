import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDatabase, seedDatabase } from '../src/db/index.js';
import { OnboardingOrchestrator } from '../src/orchestrator/OnboardingOrchestrator.js';
import { DocumentCompletenessAgent } from '../src/agents/DocumentCompletenessAgent.js';
import { OnboardingCase } from '../src/types/index.js';
import { AgentResult } from '../src/agents/types.js';

describe('Banking Domain Business Behavior & Orchestrator Decisions', () => {
  const app = createApp();

  beforeAll(() => {
    initDatabase();
    seedDatabase();
  });

  /**
   * TEST 1:
   * A complete low-risk synthetic onboarding case produces APPROVE.
   */
  it('TEST 1: A complete low-risk synthetic onboarding case produces APPROVE and completes autonomously', async () => {
    const response = await request(app)
      .post('/api/cases/case-synth-001/review')
      .send({ autonomyMode: 'EXCEPTION_ONLY' });

    expect(response.status).toBe(200);
    expect(response.body.caseId).toBe('case-synth-001');

    // Business assertions:
    // 1. Recommendation must be APPROVE
    expect(response.body.recommendation.recommendation).toBe('APPROVE');
    expect(response.body.recommendation.confidence).toBeGreaterThanOrEqual(0.9);

    // 2. Workflow must achieve COMPLETED status autonomously under EXCEPTION_ONLY
    expect(response.body.workflowStatus).toBe('COMPLETED');

    // 3. Specialist agents all completed with zero critical or high findings
    response.body.agentResults.forEach((specialist: any) => {
      expect(specialist.status).toBe('COMPLETED');
      const criticalOrHigh = specialist.findings.filter(
        (f: any) => f.severity === 'CRITICAL' || f.severity === 'HIGH'
      );
      expect(criticalOrHigh.length).toBe(0);
    });
  });

  /**
   * TEST 2:
   * A sanctions/critical-risk synthetic case does NOT produce APPROVE (it produces REJECT).
   */
  it('TEST 2: A sanctions / critical-risk synthetic case does NOT produce APPROVE (produces REJECT and requires human sign-off)', async () => {
    const response = await request(app)
      .post('/api/cases/case-synth-003/review')
      .send({ autonomyMode: 'EXCEPTION_ONLY' });

    expect(response.status).toBe(200);
    expect(response.body.caseId).toBe('case-synth-003');

    // Business assertions:
    // 1. MUST NOT produce APPROVE
    expect(response.body.recommendation.recommendation).not.toBe('APPROVE');

    // 2. Specifically produces REJECT due to regulatory sanctions hit
    expect(response.body.recommendation.recommendation).toBe('REJECT');

    // 3. Workflow halts in WAITING_FOR_HUMAN
    expect(response.body.workflowStatus).toBe('WAITING_FOR_HUMAN');

    // 4. Rationale and key reasons explicitly cite sanctions watchlist
    const hasSanctionsReason = response.body.recommendation.keyReasons.some((r: string) =>
      r.toLowerCase().includes('sanction')
    );
    expect(hasSanctionsReason).toBe(true);
    expect(response.body.recommendation.rationale).toContain('REJECTED');
  });

  /**
   * TEST 3:
   * A missing required supporting document produces MANUAL_REVIEW.
   */
  it('TEST 3: A missing required supporting document produces MANUAL_REVIEW and halts for compliance officer sign-off', async () => {
    // case-synth-002 has a missing proof-of-address document
    const response = await request(app)
      .post('/api/cases/case-synth-002/review')
      .send({ autonomyMode: 'EXCEPTION_ONLY' });

    expect(response.status).toBe(200);
    expect(response.body.caseId).toBe('case-synth-002');

    // Business assertions:
    // 1. Missing required document must NEVER produce APPROVE
    expect(response.body.recommendation.recommendation).not.toBe('APPROVE');

    // 2. Must produce MANUAL_REVIEW
    expect(response.body.recommendation.recommendation).toBe('MANUAL_REVIEW');

    // 3. Workflow must halt in WAITING_FOR_HUMAN
    expect(response.body.workflowStatus).toBe('WAITING_FOR_HUMAN');

    // 4. Key reasons must specifically identify the documentation deficiency
    const hasDocReason = response.body.recommendation.keyReasons.some((r: string) =>
      r.toLowerCase().includes('document') || r.toLowerCase().includes('address')
    );
    expect(hasDocReason).toBe(true);

    // 5. DocumentCompletenessAgent findings verify missing document code
    const docAgentResult = response.body.agentResults.find(
      (a: any) => a.agentName === 'DocumentCompletenessAgent'
    );
    expect(docAgentResult).toBeDefined();
    expect(docAgentResult.findings.some((f: any) => f.code === 'DOC_ADDRESS_STATUS_MISSING')).toBe(true);
  });

  /**
   * TEST 4:
   * Simulate an agent failure and verify the orchestrator does not silently APPROVE the case.
   * It should retry according to configured retry policy (2 total attempts) and eventually route to manual review.
   */
  it('TEST 4: Simulated agent failure executes retries and safely escalates to MANUAL_REVIEW without silent approval', async () => {
    let executionAttempts = 0;

    // Create a mock DocumentCompletenessAgent that simulates an external OCR/service outage
    class FlakyDocumentAgent extends DocumentCompletenessAgent {
      override async execute(_input: OnboardingCase): Promise<AgentResult> {
        executionAttempts++;
        throw new Error('Simulated upstream OCR service timeout (503 Service Unavailable)');
      }
    }

    const flakyOrchestrator = new OnboardingOrchestrator({
      documentCompletenessAgent: new FlakyDocumentAgent(),
    });

    // Execute review on the otherwise low-risk case (case-synth-001)
    const reviewResult = await flakyOrchestrator.executeReview('case-synth-001', 'EXCEPTION_ONLY');

    // Business & Resilience assertions:
    // 1. Retry policy verification: must have executed exactly 2 attempts (initial + 1 retry)
    expect(executionAttempts).toBe(2);

    // 2. Trace records the failure with retry count preserved
    const docStep = reviewResult.executionTrace.find((t) => t.agent === 'DocumentCompletenessAgent');
    expect(docStep).toBeDefined();
    expect(docStep?.status).toBe('FAILED');
    expect(docStep?.retryCount).toBe(1);
    expect(docStep?.error).toContain('Simulated upstream OCR service timeout');

    // 3. CRITICAL SAFETY: Must NOT silently approve when an agent fails
    expect(reviewResult.recommendation?.recommendation).not.toBe('APPROVE');

    // 4. Escalates safely to MANUAL_REVIEW
    expect(reviewResult.recommendation?.recommendation).toBe('MANUAL_REVIEW');

    // 5. Halts for human compliance intervention
    expect(reviewResult.workflowStatus).toBe('WAITING_FOR_HUMAN');

    // 6. Reasons document incomplete analysis
    const hasIncompleteReason = reviewResult.recommendation?.keyReasons.some((r) =>
      r.includes('Incomplete specialist analysis')
    );
    expect(hasIncompleteReason).toBe(true);
  });
});
