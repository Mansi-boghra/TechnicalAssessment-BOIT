# Multi-Agent Onboarding Case Reviewer

## Overview

The **Multi-Agent Onboarding Case Reviewer** is a full-stack TypeScript banking-domain application designed to demonstrate automated customer onboarding and KYC case assessment using a supervised multi-agent orchestration architecture.

> **CRITICAL DATA NOTICE**: This application is a synthetic banking demonstration. **Strictly synthetic test data is used throughout this repository.** No real customer, banking, or personally identifiable financial information (PII) is introduced, stored, or processed.

---

## Architecture

The system is organized into a decoupled full-stack architecture:

- **Frontend**: React (Vite, TypeScript, Vanilla CSS design system). Provides an interactive single-page dashboard displaying the active case, case profile details, autonomy mode controls, visual supervisor execution traces, individual agent findings, and prominent recommendation outcomes.
- **Backend**: Node.js and Express in TypeScript. Exposes REST endpoints for onboarding cases, multi-agent reviews, and audit retrieval.
- **Persistence**: Relational SQLite database using `better-sqlite3` configured with Write-Ahead Logging (`WAL`) mode and foreign key constraints. Stores structured case payloads, agent execution runs, individual findings, and review audit records.
- **Orchestration**: Custom TypeScript multi-agent state machine managing sequential hand-offs, resilient retry wrappers, explainable recommendation synthesis, and policy-driven autonomy gates.

### System Architecture Diagram

```
+-------------------------------------------------------------------------+
|                              REACT FRONTEND                             |
|        (Vite + TypeScript Single-Page Compliance Review Dashboard)      |
+------------------------------------+------------------------------------+
                                     |  HTTP REST (/api/*)
                                     v
+-------------------------------------------------------------------------+
|                          EXPRESS BACKEND API                            |
|             (Routes: /health, /cases, /cases/:id/review, /reviews)      |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                    SUPERVISOR / ORCHESTRATION ENGINE                    |
|             (State Machine, Retry Policy, Autonomy Evaluation)          |
+---------+--------------------------+--------------------------+---------+
          |                          |                          |
          v                          v                          v
+-------------------+      +-------------------+      +-------------------+
|     Document      |      |     Identity      |      |       Risk        |
|   Completeness    |      |    Consistency    |      |     Indicator     |
|      Agent        |      |      Agent        |      |       Agent       |
+---------+---------+      +---------+---------+      +---------+---------+
          |                          |                          |
          +--------------------------+--------------------------+
                                     | Typed Findings
                                     v
                           +-------------------+
                           |  Recommendation   |
                           |       Agent       |
                           +---------+---------+
                                     | Consolidated Recommendation
                                     v
                           +-------------------+
                           |  Autonomy Policy  |
                           |   Gatekeeper      |
                           +---------+---------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                      RELATIONAL PERSISTENCE (SQLite)                    |
|    Tables: cases  |  case_reviews  |  agent_runs  |  agent_findings     |
+-------------------------------------------------------------------------+
```

---

## Agent Responsibilities

The system divides domain assessment across four specialized agents and an overarching supervisor:

### 1. Document Completeness Agent
- **Goal**: Determine whether mandatory onboarding documentation is available, valid, and usable.
- **Input**: `OnboardingCase` (containing `supportingDocuments[]`).
- **Output**: Typed `AgentResult` containing status, confidence score, summary, and structured `findings[]` (e.g., `DOC_COMPLETE`, `DOC_ID_MISSING`, `DOC_ADDRESS_STATUS_MISSING`, `DOC_EXPIRED`).

### 2. Identity Consistency Agent
- **Goal**: Detect inconsistencies between customer-declared application profile data and official identity document credentials.
- **Input**: `OnboardingCase` (containing `customerProfile` and `identityDetails`).
- **Output**: Typed `AgentResult` evaluating name consistency (distinguishing minor middle-name omissions from material mismatches), document expiration dates, and cross-border nationality vs. issuing country disparities.

### 3. Risk Indicator Agent
- **Goal**: Identify basic synthetic banking/KYC risk indicators (simulated Politically Exposed Person status, simulated sanctions watchlist matches, high-risk jurisdiction flags, and income volatility).
- **Input**: `OnboardingCase` (containing `riskIndicators`, `employmentDetails`, and `addressDetails`).
- **Output**: Typed `AgentResult` highlighting regulatory flags (`RISK_SANCTIONS_MATCH`, `RISK_PEP_MATCH`, `RISK_HIGH_RISK_JURISDICTION`, `RISK_UNUSUAL_INCOME_PATTERN`, or `RISK_CLEAN_PROFILE`).

### 4. Recommendation Agent
- **Goal**: Consolidate specialist findings into an explainable, deterministic onboarding decision recommendation.
- **Input**: `RecommendationAgentInput` (combines `onboardingCase` with all specialist `AgentResult[]` outputs).
- **Output**: Typed `RecommendationAgentResult` containing recommendation (`APPROVE`, `REJECT`, or `MANUAL_REVIEW`), executive rationale, specific key reasons array, confidence metric, and generation timestamp.

### 5. Supervisor / Orchestrator
- **Goal**: Coordinate end-to-end workflow lifecycle, manage controlled agent hand-offs, enforce resilience retry wrappers, evaluate autonomy-mode policies, and record complete audit trails.
- **Input**: `caseId: string`, `autonomyMode: AutonomyMode`.
- **Output**: `CaseReviewRecord` containing `reviewId`, `caseId`, `workflowStatus`, `autonomyMode`, `agentResults`, `recommendation`, and complete `executionTrace`.

---

## Workflow and Orchestration

The end-to-end review lifecycle executes through controlled sequential hand-offs:

1. **Intake**: Case ID and autonomy mode submitted to `POST /api/cases/:id/review`.
2. **Supervisor Initialization**: Orchestrator loads the onboarding case from SQLite and transitions workflow status to `RUNNING`.
3. **Specialist Execution**:
   - `DocumentCompletenessAgent` executes via controlled retry wrapper.
   - `IdentityConsistencyAgent` executes via controlled retry wrapper.
   - `RiskIndicatorAgent` executes via controlled retry wrapper.
4. **Audit Recording**: Each agent execution run and its granular findings are immediately recorded in `agent_runs` and `agent_findings` database tables.
5. **Consolidation**: Specialist `AgentResult[]` arrays are handed off to the `RecommendationAgent`.
6. **Recommendation Synthesis**: Deterministic decision matrix evaluates critical, high, and medium severity findings.
7. **Autonomy Policy Evaluation**: The supervisor gates the recommendation through the selected autonomy mode to decide whether human sign-off is required.
8. **Final Persistence & Termination**: Complete review record is saved to `case_reviews`, and the full execution trace is returned.

---

## Autonomy Modes

The orchestrator enforces two configurable operational autonomy modes:

### 1. Human Approval Required (`HUMAN_APPROVAL_REQUIRED`)
- Every recommendation (`APPROVE`, `MANUAL_REVIEW`, or `REJECT`) terminates in `WAITING_FOR_HUMAN`.
- A human compliance officer must review the findings and confirm the outcome before any downstream action is permitted.

### 2. Human Review Only on Exception (`EXCEPTION_ONLY`)
- If the recommendation is `APPROVE` and there are **zero** high or critical findings and zero agent execution failures, the workflow achieves `COMPLETED` automatically.
- If the recommendation is `REJECT`, `MANUAL_REVIEW`, contains elevated risk indicators, or an agent failed, the workflow halts in `WAITING_FOR_HUMAN`.

> **CRITICAL BOUNDARY**: AI outputs represent advisory recommendations only. The system **DOES NOT execute actual account-opening or money-movement actions**.

---

## Workflow State Management

The supervisor engine transitions cases through explicit workflow statuses:

- `CREATED`: Review request received and initialized.
- `RUNNING`: Specialist agents actively executing.
- `WAITING_FOR_HUMAN`: Review requires human compliance officer sign-off under autonomy policy.
- `COMPLETED`: Review cleanly approved under autonomous exception-only policy.
- `FAILED`: Unrecoverable execution error.

### Termination Conditions
The workflow terminates strictly when:
1. All specialist agents have executed and a final recommendation has been evaluated against the active autonomy policy, OR
2. An unrecoverable orchestration failure occurs.

Accidental infinite loops are prevented by strictly linear, forward-only pipeline execution.

---

## Failure and Retry Handling

Every specialist agent runs inside a controlled execution wrapper (`executeAgentWithRetry`):

- **Maximum Attempts**: 2 attempts total (1 initial execution + 1 automatic retry).
- **Error Capture**: Exceptions during execution are caught, logged, and increment retry counts.
- **Typed FAILED Output**: If an agent fails both attempts, a typed `AgentResult` with `status: 'FAILED'` and `failureReason` is emitted.
- **Audit Trail**: Every attempt and captured error message is preserved in the `executionTrace` and persisted in `agent_runs`.
- **Safe Manual-Review Fallback**: The `RecommendationAgent` explicitly checks for failed specialists. Incomplete critical analysis **never results in silent approval**; it automatically escalates the recommendation to `MANUAL_REVIEW` and halts in `WAITING_FOR_HUMAN`.

---

## Auditability and Explainability

Every onboarding review produces a permanent, inspectable audit trail:

- **Execution Trace**: Step-by-step chronology tracking agent name, execution status, started timestamp, completed timestamp, and retry counts.
- **Granular Findings**: Each finding contains an explicit code, severity tier (`INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), descriptive message, and concrete evidence array.
- **Executive Rationale**: Explainable narrative explaining why the case was approved, escalated, or rejected.
- **Key Decision Reasons**: Bulleted list of decisive compliance factors contributing to the final decision.
- **Audit Endpoint**: `GET /api/reviews/:reviewId` returns the complete audit record at any time.

---

## Assumptions

- Operating exclusively on synthetic test data with simulated KYC documents and risk indicators.
- Single-node synchronous execution suitable for an assessment demonstration MVP.
- Deterministic rule sets represent realistic banking KYC/AML screening heuristics without external API dependencies.

---

## Completed Functionality

- [x] Full-stack TypeScript application with React (Vite) and Express (Node.js).
- [x] Relational SQLite persistence via `better-sqlite3` with WAL mode and schema auto-initialization.
- [x] Strongly typed banking domain entities (`CustomerProfile`, `IdentityDetails`, `AddressDetails`, `EmploymentDetails`, `SupportingDocuments`, `RiskIndicators`).
- [x] 3 synthetic seeded cases representing Low, Medium, and High risk tiers.
- [x] 4 specialized agents (`DocumentCompletenessAgent`, `IdentityConsistencyAgent`, `RiskIndicatorAgent`, `RecommendationAgent`).
- [x] Supervisor orchestrator with state machine, controlled retry wrapper, and 2 autonomy modes.
- [x] Relational audit trails storing execution traces, agent runs, and findings.
- [x] REST API endpoints (`/api/health`, `/api/cases`, `/api/cases/:id`, `/api/cases/:id/review`, `/api/reviews/:reviewId`).
- [x] Interactive single-page React dashboard with case selector, details cards, autonomy radio controls, live review runner, execution trace timeline, and findings grid.
- [x] 29 automated Vitest tests covering business decisions, edge cases, health, and agent contracts.

---

## Known Limitations

- **Deterministic Mocked AI**: Uses deterministic TypeScript business logic instead of live LLM model calls.
- **Synthetic Rule Sets**: Simplified KYC, PEP, and sanctions screening heuristics.
- **Local SQLite Database**: File-based database rather than distributed enterprise SQL.
- **No Authentication**: Built without multi-tenant authentication or role-based session tokens.
- **Simulated Screening**: Does not integrate with live government registries, bureau APIs, or real sanctions providers.

---

## Security Considerations

- **Synthetic Data Exclusively**: Prevents any PII leakage during development, assessment, and testing.
- **Environment Variables**: Port, environment modes, and paths managed via `.env` files; no hardcoded credentials.
- **Input Validation**: Strict schema and payload validation returning HTTP 400 with granular field error reporting.
- **Production Requirements**:
  - Mutual TLS (mTLS) and encryption in transit (TLS 1.3) and at rest (AES-256).
  - Role-Based Access Control (RBAC) separating review operators from compliance managers.
  - PII data minimisation and tokenisation.
  - Immutable, append-only tamper-resistant audit logs (e.g. WORM storage).
  - Secure secret vault management (e.g. AWS Secrets Manager, HashiCorp Vault).
  - API rate limiting, DDoS protection, and WAF inspection.
  - Model prompt and output safety guardrails if live LLMs are introduced.
  - Strict human oversight mandatory for all high-risk automated recommendations.

---

## Productionisation

Transitioning this prototype to enterprise banking production requires:

1. **Enterprise Database**: Migration to managed PostgreSQL with connection pooling, read replicas, and point-in-time recovery.
2. **Authentication & RBAC**: OAuth2 / OIDC integration with fine-grained access control.
3. **Real KYC & AML Integrations**: Live document verification vendors (e.g., Onfido, Jumio) and PEP/Sanctions screening feeds (e.g., Dow Jones, LexisNexis, Refinitiv).
4. **Asynchronous Queue Architecture**: Decoupling long-running agent workflows with message brokers (e.g., RabbitMQ, Apache Kafka, AWS SQS) and workflow engines (e.g., Temporal).
5. **Observability & Telemetry**: OpenTelemetry distributed tracing, structured JSON logging, and Prometheus/Grafana metrics.
6. **Containerization & CI/CD**: Docker packaging, Kubernetes orchestration, and automated vulnerability scanning pipelines.
7. **Compliance & Regulatory Review**: Model risk management (MRM / SR 11-7) validation, fairness auditing, and statutory retention policies.

---

## Safe Progression Toward Autonomous Operation

A prudent phased rollout strategy for financial institutions:

- **Stage 1 (Human-in-the-Loop Assist)**: AI generates advisory findings and recommendations; 100% of cases require mandatory human compliance officer sign-off (`HUMAN_APPROVAL_REQUIRED`).
- **Stage 2 (Exception-Based Autonomy)**: Verified low-risk cases with complete unexpired documents and clean profiles complete autonomously (`EXCEPTION_ONLY`); all exceptions, discrepancies, and elevated risk profiles route to manual compliance review.
- **Stage 3 (Managed High Autonomy)**: Expanded autonomy backed by continuous model evaluation, automated drift detection, statistical anomaly monitoring, strict drift thresholds, and immediate rollback mechanisms. High-risk, PEP, and sanctions triggers remain permanently under human supervision.

---

## Running Locally

### Prerequisites
- Node.js (v20+ recommended)
- npm

### 1. Installation
Install dependencies for both backend and frontend:
```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Start the Backend Server
In your first terminal:
```bash
cd backend
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### 3. Start the Frontend Dashboard
In your second terminal:
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173` (pre-configured with `/api` proxy to backend).*

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check returning service status (`200 OK`). |
| `GET` | `/api/cases` | Retrieves all synthetic onboarding cases. |
| `GET` | `/api/cases/:id` | Retrieves a single onboarding case by ID (`404` if not found). |
| `POST` | `/api/cases` | Validates and creates a new synthetic onboarding case (`201 Created`). |
| `POST` | `/api/cases/:id/review` | Executes supervisor multi-agent review workflow (`200 OK`). |
| `GET` | `/api/reviews/:reviewId` | Retrieves complete audit record and step trace for a review (`200 OK`). |

---

## Testing

Run the full automated test suite (29 tests across 5 test suites) from the repository root:
```bash
npm test
```
Or directly within the backend:
```bash
cd backend && npm test
```

To run a full production build check across both frontend and backend:
```bash
npm run build
```

---

## Synthetic Sample Data

The database seeds three representative synthetic profiles on startup:

1. **Low-Risk Case (`case-synth-001` - Eleanor Vance)**:
   - Complete valid Canadian Passport and Utility Bill.
   - Consistent identity declaration.
   - Clean risk profile (zero PEP, sanctions, or jurisdictional flags).
   - Expected Result: **`APPROVE`** (auto-completes under `EXCEPTION_ONLY`).

2. **Medium-Risk Case (`case-synth-002` - Marcus Aurelius Sterling)**:
   - Missing utility bill proof-of-address (`MISSING` status).
   - Minor declared name variation (middle name omitted).
   - Self-employed fluctuating income flag.
   - Expected Result: **`MANUAL_REVIEW`** (halts in `WAITING_FOR_HUMAN`).

3. **High-Risk Case (`case-synth-003` - Viktor Dmitriev)**:
   - High-risk jurisdiction match.
   - Simulated PEP match.
   - Simulated global sanctions watchlist match.
   - Expected Result: **`REJECT`** (halts in `WAITING_FOR_HUMAN`).

---

## AI Development Tools Disclosure

AI-assisted development tools were used to accelerate scaffolding, implementation and review during the monitored assessment. Architectural decisions, technology selection, agent boundaries, workflow design, risk rules, autonomy controls and final validation were reviewed and directed by the candidate.

> **AI tool used during assessment**: Antigravity

---

## Candidate-Owned Decisions

The candidate personally chose, reviewed, and directed:

- **TypeScript Contracts**: Defined strict interfaces for all entities, findings, results, and workflow steps.
- **Specialist Agent Boundaries**: Established clean separation of concerns across document verification, identity cross-referencing, risk screening, and recommendation synthesis.
- **Orchestrator Design**: Architected a supervisor state machine with sequential hand-offs and execution trace tracking.
- **Deterministic Implementation for Reliability**: Utilized deterministic rules for predictable, testable, and demonstrable evaluation without external model non-determinism.
- **Resilience & Retry Policy**: Configured a maximum 2-attempt execution wrapper with graceful degradation to manual review upon failure.
- **Autonomy Modes**: Created dual operational policies (`HUMAN_APPROVAL_REQUIRED` vs. `EXCEPTION_ONLY`) enforcing that high-risk cases always require human sign-off.
- **Architectural Safeguard**: Strictly separated advisory AI recommendations from actual account opening execution.
