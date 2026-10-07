/**
 * Multi-Agent System - Agent Definitions
 * Scaffolded for upcoming agent implementation.
 * Workflow implementation to follow in subsequent steps.
 */

export interface BaseAgent {
  name: string;
  role: string;
  evaluate(input: unknown): Promise<unknown>;
}

// Scaffolded agents placeholder
export const REGISTERED_AGENTS = [
  'IdentityVerificationAgent',
  'RiskAssessmentAgent',
  'ComplianceScreeningAgent',
] as const;
