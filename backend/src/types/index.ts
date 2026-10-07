/**
 * Multi-Agent Onboarding Case Reviewer - Banking Domain Types
 * (Strictly Synthetic Banking Onboarding Data)
 */

export type CustomerType = 'INDIVIDUAL' | 'BUSINESS';

export interface CustomerProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  customerType: CustomerType;
}

export interface IdentityDetails {
  documentType: string;
  documentNumber: string;
  issuingCountry: string;
  expiryDate: string;
  declaredName: string;
}

export interface AddressDetails {
  street: string;
  city: string;
  provinceOrState: string;
  postalCode: string;
  country: string;
}

export interface EmploymentDetails {
  status: string;
  employerName: string;
  occupation: string;
  annualIncome: number;
}

export type SupportingDocumentStatus = 'PROVIDED' | 'MISSING' | 'EXPIRED';

export interface SupportingDocument {
  id: string;
  type: string;
  status: SupportingDocumentStatus;
  documentName: string;
}

export interface RiskIndicators {
  pepFlag: boolean;
  sanctionsFlag: boolean;
  highRiskCountry: boolean;
  unusualIncomeFlag: boolean;
}

export type CaseStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'ESCALATED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface OnboardingCase {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  riskTier: RiskLevel;
  isSynthetic: boolean;
  customerProfile: CustomerProfile;
  identityDetails: IdentityDetails;
  addressDetails: AddressDetails;
  employmentDetails: EmploymentDetails;
  supportingDocuments: SupportingDocument[];
  riskIndicators: RiskIndicators;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateCaseInput = Omit<OnboardingCase, 'id' | 'createdAt' | 'updatedAt' | 'isSynthetic'> & {
  id?: string;
  caseNumber?: string;
  status?: CaseStatus;
  riskTier?: RiskLevel;
  isSynthetic?: boolean;
};

// Audit and Agent records
export interface AgentRun {
  id: string;
  caseId: string;
  agentName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  summary?: string;
}

export type AuditFindingSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'WARNING';

export interface AgentFinding {
  id: string;
  runId?: string;
  caseId: string;
  agentName: string;
  severity: AuditFindingSeverity;
  category: string;
  description: string;
  passed: boolean;
  createdAt: string;
}

export interface HealthResponse {
  status: 'ok';
  service: 'multi-agent-onboarding-reviewer';
}
