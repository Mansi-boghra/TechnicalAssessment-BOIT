import { useState, useEffect, useCallback } from 'react';

// Domain and Review Types
export type AutonomyMode = 'HUMAN_APPROVAL_REQUIRED' | 'EXCEPTION_ONLY';

export interface SupportingDocument {
  id: string;
  type: string;
  status: 'PROVIDED' | 'MISSING' | 'EXPIRED';
  documentName: string;
}

export interface RiskIndicators {
  pepFlag: boolean;
  sanctionsFlag: boolean;
  highRiskCountry: boolean;
  unusualIncomeFlag: boolean;
}

export interface OnboardingCase {
  id: string;
  caseNumber: string;
  status: string;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  isSynthetic: boolean;
  customerProfile: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    customerType: 'INDIVIDUAL' | 'BUSINESS';
  };
  identityDetails: {
    documentType: string;
    documentNumber: string;
    issuingCountry: string;
    expiryDate: string;
    declaredName: string;
  };
  addressDetails: {
    street: string;
    city: string;
    provinceOrState: string;
    postalCode: string;
    country: string;
  };
  employmentDetails: {
    status: string;
    employerName: string;
    occupation: string;
    annualIncome: number;
  };
  supportingDocuments: SupportingDocument[];
  riskIndicators: RiskIndicators;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentFinding {
  code: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  evidence: string[];
}

export interface AgentResult {
  agentName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  findings: AgentFinding[];
  confidence: number;
  summary: string;
  startedAt: string;
  completedAt: string;
  failureReason?: string;
}

export interface WorkflowStep {
  step: number;
  agent: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'RUNNING';
  startedAt: string;
  completedAt: string;
  retryCount: number;
  error?: string;
}

export interface RecommendationResult {
  agentName: string;
  status: string;
  recommendation: 'APPROVE' | 'REJECT' | 'MANUAL_REVIEW';
  rationale: string;
  keyReasons: string[];
  findings?: AgentFinding[];
  confidence: number;
  generatedAt: string;
}

export interface CaseReviewResponse {
  reviewId: string;
  caseId: string;
  workflowStatus: 'CREATED' | 'RUNNING' | 'WAITING_FOR_HUMAN' | 'COMPLETED' | 'FAILED';
  autonomyMode: AutonomyMode;
  agentResults: AgentResult[];
  recommendation: RecommendationResult;
  executionTrace: WorkflowStep[];
  createdAt: string;
  completedAt: string;
}

// Agent metadata descriptions for UI
const AGENT_GOALS: Record<string, string> = {
  DocumentCompletenessAgent: 'Determine whether mandatory onboarding documentation is available and usable.',
  IdentityConsistencyAgent: 'Detect inconsistencies between customer-declared data and identity credentials.',
  RiskIndicatorAgent: 'Identify basic synthetic banking/KYC risk indicators (PEP, sanctions, jurisdiction, income).',
  RecommendationAgent: 'Consolidate specialist findings into an explainable, deterministic onboarding recommendation.',
};

export function App() {
  const [cases, setCases] = useState<OnboardingCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('EXCEPTION_ONLY');
  const [reviewResult, setReviewResult] = useState<CaseReviewResponse | null>(null);

  const [loadingCases, setLoadingCases] = useState<boolean>(true);
  const [reviewing, setReviewing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Cases on Mount
  const loadCases = useCallback(async () => {
    setLoadingCases(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/cases');
      if (!res.ok) {
        throw new Error(`Failed to load cases: HTTP ${res.status}`);
      }
      const data: OnboardingCase[] = await res.json();
      setCases(data);
      if (data.length > 0 && !selectedCaseId) {
        setSelectedCaseId(data[0].id);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Backend service unavailable. Please ensure the backend is running.'
      );
    } finally {
      setLoadingCases(false);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Handle Review Submission
  const handleRunReview = async () => {
    if (!selectedCaseId) return;

    setReviewing(true);
    setErrorMessage(null);
    setReviewResult(null);

    try {
      const res = await fetch(`/api/cases/${selectedCaseId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autonomyMode }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Review execution failed with status ${res.status}`);
      }

      const result: CaseReviewResponse = await res.json();
      setReviewResult(result);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown review workflow error occurred.');
    } finally {
      setReviewing(false);
    }
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <div className="app-container">
      {/* 1. Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon">🛡️</div>
          <div>
            <h1 className="brand-title">Multi-Agent Onboarding Case Reviewer</h1>
            <p className="brand-subtitle">Synthetic banking onboarding demonstration</p>
          </div>
        </div>

        <div>
          <span className="badge badge-synth" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}>
            <span className="status-dot"></span>
            SYNTHETIC DATA ONLY
          </span>
        </div>
      </header>

      {/* Backend Unavailable Alert */}
      {errorMessage && (
        <div className="alert-box alert-error" style={{ marginBottom: '1.5rem' }}>
          <strong>⚠️ Service Notification:</strong> {errorMessage}
          <button
            onClick={loadCases}
            style={{ marginLeft: '1rem', textDecoration: 'underline', color: 'inherit', fontWeight: 600 }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 2. Case Selection */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 className="section-title">
          <span>📁 Select Synthetic Onboarding Case</span>
        </h2>

        {loadingCases ? (
          <div className="card" style={{ padding: '1rem' }}>Loading synthetic onboarding cases...</div>
        ) : (
          <div className="case-selection-grid">
            {cases.map((c) => {
              const isSelected = c.id === selectedCaseId;
              const riskColor =
                c.riskTier === 'LOW'
                  ? 'var(--accent-emerald)'
                  : c.riskTier === 'MEDIUM'
                  ? 'var(--accent-amber)'
                  : 'var(--accent-rose)';

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseId(c.id);
                    setReviewResult(null); // Reset review when changing case
                  }}
                  className={`card case-select-card ${isSelected ? 'case-select-active' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <code style={{ fontSize: '0.78rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                      {c.caseNumber}
                    </code>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${riskColor}22`,
                        color: riskColor,
                        border: `1px solid ${riskColor}55`,
                      }}
                    >
                      {c.riskTier} RISK
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                    {c.customerProfile.firstName} {c.customerProfile.lastName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {c.customerProfile.customerType} • {c.customerProfile.nationality} • {c.employmentDetails.occupation}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Case Details (Active Case) */}
      {selectedCase && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-title">
            <span>📋 Case Details: {selectedCase.customerProfile.firstName} {selectedCase.customerProfile.lastName}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              ({selectedCase.caseNumber})
            </span>
          </h2>

          <div className="details-grid">
            {/* Customer Profile */}
            <div className="card details-card">
              <h3 className="card-subheading">👤 Customer Profile</h3>
              <div className="detail-item">
                <span className="detail-label">Full Name:</span>
                <span className="detail-value">{selectedCase.customerProfile.firstName} {selectedCase.customerProfile.lastName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date of Birth:</span>
                <span className="detail-value">{selectedCase.customerProfile.dateOfBirth}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Nationality:</span>
                <span className="detail-value">{selectedCase.customerProfile.nationality}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Customer Type:</span>
                <span className="detail-value">{selectedCase.customerProfile.customerType}</span>
              </div>
            </div>

            {/* Identity Details */}
            <div className="card details-card">
              <h3 className="card-subheading">🪪 Identity Credentials</h3>
              <div className="detail-item">
                <span className="detail-label">Document Type:</span>
                <span className="detail-value">{selectedCase.identityDetails.documentType}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Document Number:</span>
                <span className="detail-value"><code>{selectedCase.identityDetails.documentNumber}</code></span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Issuing Country:</span>
                <span className="detail-value">{selectedCase.identityDetails.issuingCountry}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Expiry Date:</span>
                <span className="detail-value">{selectedCase.identityDetails.expiryDate}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Declared ID Name:</span>
                <span className="detail-value"><em>"{selectedCase.identityDetails.declaredName}"</em></span>
              </div>
            </div>

            {/* Address & Employment */}
            <div className="card details-card">
              <h3 className="card-subheading">📍 Address & Employment</h3>
              <div className="detail-item">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{selectedCase.addressDetails.street}, {selectedCase.addressDetails.city}, {selectedCase.addressDetails.country}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value">{selectedCase.employmentDetails.status}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Employer:</span>
                <span className="detail-value">{selectedCase.employmentDetails.employerName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Occupation:</span>
                <span className="detail-value">{selectedCase.employmentDetails.occupation}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Annual Income:</span>
                <span className="detail-value">${selectedCase.employmentDetails.annualIncome.toLocaleString()}</span>
              </div>
            </div>

            {/* Supporting Documents & Risk Indicators */}
            <div className="card details-card">
              <h3 className="card-subheading">📄 Documents & Risk Flags</h3>
              <div style={{ marginBottom: '0.85rem' }}>
                <span className="detail-label" style={{ display: 'block', marginBottom: '0.4rem' }}>Supporting Documents:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedCase.supportingDocuments.map((doc) => (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span>{doc.documentName}</span>
                      <span className={`badge ${doc.status === 'PROVIDED' ? 'badge-healthy' : 'badge-error'}`} style={{ padding: '0.15rem 0.5rem' }}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="detail-label" style={{ display: 'block', marginBottom: '0.4rem' }}>Risk Indicators:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span className={`badge ${selectedCase.riskIndicators.pepFlag ? 'badge-error' : 'badge-healthy'}`} style={{ fontSize: '0.7rem' }}>
                    PEP: {selectedCase.riskIndicators.pepFlag ? 'FLAGGED' : 'CLEAN'}
                  </span>
                  <span className={`badge ${selectedCase.riskIndicators.sanctionsFlag ? 'badge-error' : 'badge-healthy'}`} style={{ fontSize: '0.7rem' }}>
                    Sanctions: {selectedCase.riskIndicators.sanctionsFlag ? 'FLAGGED' : 'CLEAN'}
                  </span>
                  <span className={`badge ${selectedCase.riskIndicators.highRiskCountry ? 'badge-error' : 'badge-healthy'}`} style={{ fontSize: '0.7rem' }}>
                    High-Risk Jurisdiction: {selectedCase.riskIndicators.highRiskCountry ? 'FLAGGED' : 'CLEAN'}
                  </span>
                  <span className={`badge ${selectedCase.riskIndicators.unusualIncomeFlag ? 'badge-synth' : 'badge-healthy'}`} style={{ fontSize: '0.7rem' }}>
                    Unusual Income: {selectedCase.riskIndicators.unusualIncomeFlag ? 'FLAGGED' : 'CLEAN'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Autonomy Mode & 5. Review Button */}
      <section className="card" style={{ marginBottom: '2.5rem', background: 'rgba(15, 23, 42, 0.9)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem' }}>
          ⚙️ Supervisor Autonomy Policy & Execution
        </h2>

        <div className="autonomy-selector-grid">
          <label className={`autonomy-option-card ${autonomyMode === 'EXCEPTION_ONLY' ? 'autonomy-active' : ''}`}>
            <input
              type="radio"
              name="autonomyMode"
              value="EXCEPTION_ONLY"
              checked={autonomyMode === 'EXCEPTION_ONLY'}
              onChange={() => setAutonomyMode('EXCEPTION_ONLY')}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                Human Review Only on Exception (EXCEPTION_ONLY)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Clean approvals with zero exceptions complete autonomously. Any rejection, manual review trigger, or agent failure halts for human sign-off.
              </div>
            </div>
          </label>

          <label className={`autonomy-option-card ${autonomyMode === 'HUMAN_APPROVAL_REQUIRED' ? 'autonomy-active' : ''}`}>
            <input
              type="radio"
              name="autonomyMode"
              value="HUMAN_APPROVAL_REQUIRED"
              checked={autonomyMode === 'HUMAN_APPROVAL_REQUIRED'}
              onChange={() => setAutonomyMode('HUMAN_APPROVAL_REQUIRED')}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                Human Approval Required (HUMAN_APPROVAL_REQUIRED)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Every recommendation halts in <code>WAITING_FOR_HUMAN</code>. A compliance officer must review and confirm every onboarding decision.
              </div>
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            id="run-review-btn"
            className="button-primary"
            style={{ padding: '0.75rem 1.8rem', fontSize: '1rem', fontWeight: 600 }}
            onClick={handleRunReview}
            disabled={reviewing || !selectedCaseId}
          >
            {reviewing ? '⏳ Reviewing...' : '🚀 Run Multi-Agent Review'}
          </button>

          {/* 10. Loading State message */}
          {reviewing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-cyan)' }}>
              <span className="status-dot pulse" style={{ width: '10px', height: '10px' }}></span>
              <span style={{ fontWeight: 500 }}>Agents are reviewing the onboarding case...</span>
            </div>
          )}
        </div>
      </section>

      {/* 8. Final Recommendation Banner (When Review Available) */}
      {reviewResult && (
        <section style={{ marginBottom: '2.5rem' }}>
          {(() => {
            const rec = reviewResult.recommendation.recommendation;
            const isApprove = rec === 'APPROVE';
            const isReject = rec === 'REJECT';
            const recBadgeClass = isApprove ? 'rec-approve' : isReject ? 'rec-reject' : 'rec-manual';
            const recIcon = isApprove ? '✅' : isReject ? '⛔' : '⚠️';
            const recText = isApprove ? 'APPROVE' : isReject ? 'REJECT' : 'MANUAL REVIEW';

            const requiresHuman = reviewResult.workflowStatus === 'WAITING_FOR_HUMAN';

            return (
              <div className={`card recommendation-banner ${recBadgeClass}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                      Consolidated Multi-Agent Recommendation
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem' }}>
                      <span style={{ fontSize: '2rem' }}>{recIcon}</span>
                      <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        {recText}
                      </h2>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className={`badge ${requiresHuman ? 'badge-error' : 'badge-healthy'}`}>
                        {requiresHuman ? '⚠️ Human Intervention Required' : '⚡ Autonomous Completion'}
                      </span>
                      <span className="badge badge-pending">
                        Status: {reviewResult.workflowStatus}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Review ID: <code>{reviewResult.reviewId}</code> • Confidence: {(reviewResult.recommendation.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Executive Rationale:
                  </div>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {reviewResult.recommendation.rationale}
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Key Decision Factors:
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {reviewResult.recommendation.keyReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* 6. Execution Trace */}
      {reviewResult && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-title">
            <span>🔄 Supervisor Orchestration Execution Trace</span>
          </h2>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="trace-timeline">
              {/* Supervisor Root Step */}
              <div className="trace-item">
                <div className="trace-node-circle trace-node-completed">👑</div>
                <div className="trace-node-content">
                  <div className="trace-node-title">Supervisor Orchestrator Engine</div>
                  <div className="trace-node-desc">
                    Mode: <code>{reviewResult.autonomyMode}</code> • Initialized workflow state machine
                  </div>
                </div>
              </div>

              {/* Dynamic steps from execution trace */}
              {reviewResult.executionTrace.map((step) => {
                const isFail = step.status === 'FAILED';
                const startTime = new Date(step.startedAt).toLocaleTimeString();
                const finishTime = new Date(step.completedAt).toLocaleTimeString();

                return (
                  <div key={step.step} className="trace-item">
                    <div className={`trace-node-circle ${isFail ? 'trace-node-failed' : 'trace-node-completed'}`}>
                      {isFail ? '❌' : '✓'}
                    </div>
                    <div className="trace-node-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="trace-node-title">
                          Step {step.step}: {step.agent}
                        </div>
                        <span className={`badge ${isFail ? 'badge-error' : 'badge-healthy'}`} style={{ fontSize: '0.7rem' }}>
                          {step.status}
                        </span>
                      </div>
                      <div className="trace-node-desc">
                        <span>Retries: {step.retryCount} attempt(s)</span> •{' '}
                        <span>Time: {startTime} → {finishTime}</span>
                        {step.error && (
                          <div style={{ color: 'var(--accent-rose)', marginTop: '0.25rem' }}>
                            Error: {step.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7. Specialist Agent Findings */}
      {reviewResult && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-title">
            <span>🔍 Specialist Agent Findings & Reasoning</span>
          </h2>

          <div className="findings-cards-grid">
            {reviewResult.agentResults.map((agent) => {
              const isFail = agent.status === 'FAILED';
              const agentGoal = AGENT_GOALS[agent.agentName] || 'Specialist compliance evaluation.';

              return (
                <div key={agent.agentName} className={`card ${isFail ? 'agent-failed-card' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{agent.agentName}</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {agentGoal}
                      </p>
                    </div>
                    <span className={`badge ${isFail ? 'badge-error' : 'badge-healthy'}`}>
                      {agent.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 500 }}>
                      Agent Summary (Confidence: {(agent.confidence * 100).toFixed(0)}%):
                    </div>
                    <div>{agent.summary}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Findings ({agent.findings.length}):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {agent.findings.map((f, fIdx) => {
                        const sevColor =
                          f.severity === 'CRITICAL'
                            ? 'var(--accent-rose)'
                            : f.severity === 'HIGH'
                            ? '#ea580c'
                            : f.severity === 'MEDIUM'
                            ? 'var(--accent-amber)'
                            : 'var(--accent-emerald)';

                        return (
                          <div key={fIdx} className="finding-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                              <span
                                className="badge"
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.15rem 0.4rem',
                                  backgroundColor: `${sevColor}22`,
                                  color: sevColor,
                                  border: `1px solid ${sevColor}55`,
                                }}
                              >
                                {f.severity}
                              </span>
                              <code style={{ fontSize: '0.75rem' }}>{f.code}</code>
                            </div>
                            <div style={{ fontSize: '0.83rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                              {f.message}
                            </div>
                            {f.evidence && f.evidence.length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {f.evidence.map((ev, evIdx) => (
                                  <div key={evIdx}>• {ev}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="app-footer">
        Multi-Agent Onboarding Case Reviewer • Architecture: React + Vite + TypeScript Frontend • Express + SQLite (better-sqlite3) Backend • Strict Synthetic Data Safeguards
      </footer>
    </div>
  );
}

export default App;
