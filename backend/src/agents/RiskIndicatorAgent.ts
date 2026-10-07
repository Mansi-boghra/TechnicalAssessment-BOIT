import { BaseAgent } from './base.js';
import { AgentFinding, AgentResult } from './types.js';
import { OnboardingCase } from '../types/index.js';

export class RiskIndicatorAgent extends BaseAgent<OnboardingCase, AgentResult> {
  readonly name = 'RiskIndicatorAgent';
  readonly goal = 'Identify basic synthetic banking/KYC risk indicators.';
  readonly responsibility =
    'Evaluates synthetic risk indicators (simulated PEP status, simulated sanctions hits, jurisdictional risk, and income anomalies). NOTE: This is a synthetic demonstration and NOT a production AML/KYC decision engine.';

  protected async evaluate(input: OnboardingCase, startedAt: string): Promise<AgentResult> {
    const findings: AgentFinding[] = [];
    const risks = input.riskIndicators;
    const employment = input.employmentDetails;
    const address = input.addressDetails;

    // NOTE FOR FUTURE LLM ENHANCEMENT:
    // An LLM can perform real-time adverse media scanning, semantic news search, complex entity resolution,
    // and beneficial ownership chain graph traversal against actual KYC data stores.
    // NOTE: This implementation operates on synthetic mock indicators for assessment demo purposes.

    // 1. Sanctions Check (Highest priority regulatory risk)
    if (risks.sanctionsFlag) {
      findings.push({
        code: 'RISK_SANCTIONS_MATCH',
        severity: 'CRITICAL',
        message: '[SYNTHETIC DEMO ONLY] Simulated positive match on global sanctions / restricted party watchlist.',
        evidence: [
          'Sanctions watchlist simulator returned positive match',
          `Applicant Name: ${input.customerProfile.firstName} ${input.customerProfile.lastName}`,
          `Simulated Flag: sanctionsFlag = true`,
        ],
      });
    }

    // 2. Politically Exposed Person (PEP) Check
    if (risks.pepFlag) {
      findings.push({
        code: 'RISK_PEP_MATCH',
        severity: 'HIGH',
        message: '[SYNTHETIC DEMO ONLY] Simulated Politically Exposed Person (PEP) or close associate indicator identified.',
        evidence: [
          'PEP simulation watchlist returned positive match',
          `Occupation: ${employment.occupation}`,
          `Employer: ${employment.employerName}`,
          `Simulated Flag: pepFlag = true`,
        ],
      });
    }

    // 3. High Risk Jurisdiction / Country Check
    if (risks.highRiskCountry) {
      findings.push({
        code: 'RISK_HIGH_RISK_JURISDICTION',
        severity: 'HIGH',
        message: '[SYNTHETIC DEMO ONLY] Applicant residence or citizenship associated with simulated high-risk / FATF monitoring jurisdiction.',
        evidence: [
          `Jurisdiction: ${address.country}`,
          `Simulated Flag: highRiskCountry = true`,
        ],
      });
    }

    // 4. Unusual Income / Transaction Volume Flag Check
    if (risks.unusualIncomeFlag) {
      findings.push({
        code: 'RISK_UNUSUAL_INCOME_PATTERN',
        severity: 'MEDIUM',
        message: `Income pattern flagged as unusual or volatile relative to stated employment occupation (${employment.occupation}).`,
        evidence: [
          `Declared Annual Income: $${employment.annualIncome.toLocaleString()}`,
          `Employment Status: ${employment.status}`,
          `Simulated Flag: unusualIncomeFlag = true`,
        ],
      });
    }

    // Calculate confidence and summary
    const hasSanctions = findings.some((f) => f.code === 'RISK_SANCTIONS_MATCH');
    const hasPep = findings.some((f) => f.code === 'RISK_PEP_MATCH');
    const hasHighRiskCountry = findings.some((f) => f.code === 'RISK_HIGH_RISK_JURISDICTION');
    const hasUnusualIncome = findings.some((f) => f.code === 'RISK_UNUSUAL_INCOME_PATTERN');

    let confidence = 0.98;
    let summary: string;

    if (hasSanctions) {
      confidence = 0.99;
      summary = `CRITICAL REGULATORY RISK: Simulated sanctions match detected. Immediate block recommendation.`;
    } else if (hasPep || hasHighRiskCountry) {
      confidence = 0.95;
      summary = `ELEVATED RISK: Simulated PEP or high-risk jurisdiction triggers identified, requiring enhanced due diligence.`;
    } else if (hasUnusualIncome) {
      confidence = 0.92;
      summary = `MODERATE RISK: Simulated income anomaly or volatile self-employment pattern detected.`;
    } else {
      findings.push({
        code: 'RISK_CLEAN_PROFILE',
        severity: 'INFO',
        message: 'No simulated PEP, sanctions, jurisdictional, or income risk indicators detected.',
        evidence: ['All synthetic risk flags evaluated as clean (false)'],
      });
      summary = `Clean synthetic risk profile: No simulated sanctions, PEP, jurisdictional, or income flags present.`;
    }

    const completedAt = new Date().toISOString();

    return {
      agentName: this.name,
      status: 'COMPLETED',
      findings,
      confidence,
      summary,
      startedAt,
      completedAt,
    };
  }

  protected createFailureResult(reason: string, startedAt: string, completedAt: string): AgentResult {
    return {
      agentName: this.name,
      status: 'FAILED',
      findings: [
        {
          code: 'AGENT_EXECUTION_FAILURE',
          severity: 'CRITICAL',
          message: `RiskIndicatorAgent failed during execution: ${reason}`,
          evidence: [reason],
        },
      ],
      confidence: 0,
      summary: `Execution error in RiskIndicatorAgent: ${reason}`,
      startedAt,
      completedAt,
      failureReason: reason,
    };
  }
}
