import { AgentResult, AgentStatus, RecommendationAgentResult } from '../agents/types.js';

export type WorkflowStatus =
  | 'CREATED'
  | 'RUNNING'
  | 'WAITING_FOR_HUMAN'
  | 'COMPLETED'
  | 'FAILED';

export type AutonomyMode =
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'EXCEPTION_ONLY';

export interface WorkflowStep {
  step: number;
  agent: string;
  status: AgentStatus;
  startedAt: string;
  completedAt: string;
  retryCount: number;
  error?: string;
}

export interface CaseReviewRecord {
  reviewId: string;
  caseId: string;
  workflowStatus: WorkflowStatus;
  autonomyMode: AutonomyMode;
  agentResults: AgentResult[];
  recommendation: RecommendationAgentResult | null;
  executionTrace: WorkflowStep[];
  createdAt: string;
  completedAt: string;
}

export interface ReviewCaseRequest {
  autonomyMode?: AutonomyMode;
}
