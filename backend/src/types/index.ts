/**
 * Multi-Agent Onboarding Case Reviewer - Core Types
 * (Synthetic Banking Onboarding Domain)
 */

export type CaseStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'ESCALATED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SyntheticApplicant {
  id: string;
  applicantRef: string;
  fullName: string;
  country: string;
  riskScore: number;
  syntheticKycStatus: 'VERIFIED' | 'FLAGGED' | 'INCOMPLETE';
  createdAt: string;
}

export interface ReviewCase {
  id: string;
  applicantId: string;
  status: CaseStatus;
  overallRisk: RiskLevel;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentReviewResult {
  agentName: string;
  passed: boolean;
  score: number;
  findings: string[];
  recommendation: 'APPROVE' | 'REJECT' | 'ESCALATE';
  reviewedAt: string;
}

export interface HealthResponse {
  status: 'ok';
  service: 'multi-agent-onboarding-reviewer';
}
