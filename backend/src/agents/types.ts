import { OnboardingCase } from '../types/index.js';

export type AgentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type FindingSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AgentFinding {
  code: string;
  severity: FindingSeverity;
  message: string;
  evidence: string[];
}

export interface AgentResult {
  agentName: string;
  status: AgentStatus;
  findings: AgentFinding[];
  confidence: number;
  summary: string;
  startedAt: string;
  completedAt: string;
  failureReason?: string;
}

export type RecommendationDecision = 'APPROVE' | 'REJECT' | 'MANUAL_REVIEW';

export interface RecommendationAgentResult extends AgentResult {
  recommendation: RecommendationDecision;
  rationale: string;
  keyReasons: string[];
  generatedAt: string;
}

export interface RecommendationAgentInput {
  onboardingCase: OnboardingCase;
  specialistResults: AgentResult[];
}
