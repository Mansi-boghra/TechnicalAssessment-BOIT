import { BaseAgent } from './base.js';
import {
  RecommendationAgentInput,
  RecommendationAgentResult,
  RecommendationDecision,
  AgentFinding,
  AgentResult,
} from './types.js';

export class RecommendationAgent extends BaseAgent<RecommendationAgentInput, RecommendationAgentResult> {
  readonly name = 'RecommendationAgent';
  readonly goal = 'Consolidate the specialist findings into an explainable recommendation.';
  readonly responsibility =
    'Synthesizes findings across document completeness, identity consistency, and risk specialist agents to produce a deterministic, explainable onboarding decision recommendation (APPROVE, REJECT, or MANUAL_REVIEW). NOTE: AI outputs are recommendations only and never execute account opening.';

  protected async evaluate(input: RecommendationAgentInput, startedAt: string): Promise<RecommendationAgentResult> {
    const { onboardingCase, specialistResults } = input;

    // Collect all findings across specialists
    const allFindings: AgentFinding[] = [];
    for (const specialist of specialistResults) {
      allFindings.push(...(specialist.findings || []));
    }

    const keyReasons: string[] = [];

    // NOTE FOR FUTURE LLM ENHANCEMENT:
    // A reasoning LLM (e.g. Claude 3.5 Sonnet, GPT-4o) could ingest the specialist results and applicant profile
    // to draft an executive compliance briefing, cite specific statutory AML guidelines,
    // and propose tailored next steps for compliance officers.

    // 1. Critical Rules Evaluation: Immediate Rejection Triggers
    const criticalFindings = allFindings.filter((f) => f.severity === 'CRITICAL');
    const hasSanctions = allFindings.some((f) => f.code === 'RISK_SANCTIONS_MATCH');

    // 2. High Severity Triggers: Manual Review Requirements
    const highFindings = allFindings.filter((f) => f.severity === 'HIGH');
    const hasMissingMandatoryDoc = allFindings.some(
      (f) =>
        f.code === 'DOC_ID_MISSING' ||
        f.code === 'DOC_ID_STATUS_MISSING' ||
        f.code === 'DOC_ADDRESS_MISSING' ||
        f.code === 'DOC_ADDRESS_STATUS_MISSING'
    );
    const hasNameMismatch = allFindings.some((f) => f.code === 'IDENT_NAME_MISMATCH');
    const hasPep = allFindings.some((f) => f.code === 'RISK_PEP_MATCH');
    const hasHighRiskCountry = allFindings.some((f) => f.code === 'RISK_HIGH_RISK_JURISDICTION');

    // 3. Medium Severity Triggers: Minor Review or Information
    const mediumFindings = allFindings.filter((f) => f.severity === 'MEDIUM');

    let recommendation: RecommendationDecision;
    let rationale: string;
    let confidence: number;

    // DETERMINISTIC DECISION MATRIX:
    if (hasSanctions) {
      recommendation = 'REJECT';
      keyReasons.push('Simulated sanctions match detected by RiskIndicatorAgent. Regulatory policy mandates immediate block.');
      criticalFindings.forEach((f) => keyReasons.push(`[Critical] ${f.message}`));
      rationale =
        'The application must be REJECTED immediately. Simulated sanctions watchlist check matched the applicant entity. Under banking compliance policies, accounts cannot be opened for entities on global sanctions lists.';
      confidence = 0.99;
    } else if (criticalFindings.length > 0) {
      recommendation = 'REJECT';
      keyReasons.push('Critical compliance deficiencies identified across agent evaluation.');
      criticalFindings.forEach((f) => keyReasons.push(`[Critical] ${f.message}`));
      rationale =
        'The application is recommended for REJECTION due to critical identity or documentation failures that cannot be resolved through routine onboarding.';
      confidence = 0.95;
    } else if (hasMissingMandatoryDoc || hasNameMismatch || hasPep || hasHighRiskCountry || highFindings.length > 0) {
      recommendation = 'MANUAL_REVIEW';
      if (hasMissingMandatoryDoc) {
        keyReasons.push('Mandatory onboarding documentation (government ID or proof of address) is missing or unverified.');
      }
      if (hasNameMismatch) {
        keyReasons.push('Discrepancy detected between declared applicant name and official identity document.');
      }
      if (hasPep) {
        keyReasons.push('Simulated Politically Exposed Person (PEP) flag requires Enhanced Due Diligence (EDD).');
      }
      if (hasHighRiskCountry) {
        keyReasons.push('Applicant jurisdiction is subject to heightened AML compliance monitoring.');
      }
      highFindings.forEach((f) => {
        if (!keyReasons.some((r) => r.includes(f.code))) {
          keyReasons.push(`[High Risk] ${f.message}`);
        }
      });
      rationale =
        'The application requires MANUAL_REVIEW by a compliance officer. While no direct sanction matches exist, material inconsistencies, missing documentation, or simulated elevated risk indicators necessitate human intervention before any account decision.';
      confidence = 0.92;
    } else if (mediumFindings.length > 0) {
      recommendation = 'MANUAL_REVIEW';
      mediumFindings.forEach((f) => keyReasons.push(`[Medium Attention] ${f.message}`));
      rationale =
        'The application is flagged for secondary MANUAL_REVIEW due to minor name formatting variations, income flags, or expired secondary documentation.';
      confidence = 0.88;
    } else {
      recommendation = 'APPROVE';
      keyReasons.push('All mandatory identity credentials and proof of address verified and unexpired.');
      keyReasons.push('Customer profile details match identity documents consistently.');
      keyReasons.push('Clean risk assessment: No sanctions, PEP, or jurisdictional risk indicators flagged.');
      rationale =
        'The application satisfies all synthetic onboarding compliance thresholds. Documentation is complete, identity is consistent, and risk indicators are clean. Recommended for APPROVAL.';
      confidence = 0.96;
    }

    const completedAt = new Date().toISOString();
    const generatedAt = completedAt;

    return {
      agentName: this.name,
      status: 'COMPLETED',
      recommendation,
      rationale,
      keyReasons,
      findings: allFindings,
      confidence,
      summary: `Recommendation: ${recommendation} (Confidence: ${(confidence * 100).toFixed(0)}%). ${keyReasons.length} key factor(s) evaluated.`,
      startedAt,
      completedAt,
      generatedAt,
    };
  }

  protected createFailureResult(reason: string, startedAt: string, completedAt: string): RecommendationAgentResult {
    return {
      agentName: this.name,
      status: 'FAILED',
      recommendation: 'MANUAL_REVIEW', // Conservative fallback on error
      rationale: `Orchestrator failure in RecommendationAgent: ${reason}. Escalating to human compliance officer.`,
      keyReasons: [`System failure: ${reason}`],
      findings: [
        {
          code: 'AGENT_EXECUTION_FAILURE',
          severity: 'CRITICAL',
          message: `RecommendationAgent failed: ${reason}`,
          evidence: [reason],
        },
      ],
      confidence: 0,
      summary: `Execution error in RecommendationAgent: ${reason}`,
      startedAt,
      completedAt,
      generatedAt: completedAt,
      failureReason: reason,
    };
  }
}
