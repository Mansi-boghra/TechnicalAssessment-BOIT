import { db } from '../db/index.js';
import { OnboardingCase, AgentRun, AgentFinding } from '../types/index.js';

interface CaseRow {
  id: string;
  case_number: string;
  customer_name: string;
  customer_type: string;
  status: string;
  risk_tier: string;
  is_synthetic: number;
  payload_json: string;
  created_at: string;
  updated_at: string;
}

export class CaseRepository {
  static findAll(): OnboardingCase[] {
    const stmt = db.prepare('SELECT * FROM cases ORDER BY created_at DESC');
    const rows = stmt.all() as CaseRow[];
    return rows.map((row) => JSON.parse(row.payload_json) as OnboardingCase);
  }

  static findById(id: string): OnboardingCase | null {
    const stmt = db.prepare('SELECT * FROM cases WHERE id = ?');
    const row = stmt.get(id) as CaseRow | undefined;
    if (!row) {
      return null;
    }
    return JSON.parse(row.payload_json) as OnboardingCase;
  }

  static findByCaseNumber(caseNumber: string): OnboardingCase | null {
    const stmt = db.prepare('SELECT * FROM cases WHERE case_number = ?');
    const row = stmt.get(caseNumber) as CaseRow | undefined;
    if (!row) {
      return null;
    }
    return JSON.parse(row.payload_json) as OnboardingCase;
  }

  static create(onboardingCase: OnboardingCase): OnboardingCase {
    const customerName = `${onboardingCase.customerProfile.firstName} ${onboardingCase.customerProfile.lastName}`.trim();
    const stmt = db.prepare(`
      INSERT INTO cases (
        id,
        case_number,
        customer_name,
        customer_type,
        status,
        risk_tier,
        is_synthetic,
        payload_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      onboardingCase.id,
      onboardingCase.caseNumber,
      customerName,
      onboardingCase.customerProfile.customerType,
      onboardingCase.status,
      onboardingCase.riskTier,
      onboardingCase.isSynthetic ? 1 : 0,
      JSON.stringify(onboardingCase),
      onboardingCase.createdAt,
      onboardingCase.updatedAt
    );

    return onboardingCase;
  }
}

export class AgentRunRepository {
  static create(run: {
    id: string;
    caseId: string;
    agentName: string;
    status: string;
    startedAt: string;
    completedAt?: string;
    summary?: string;
    reviewId?: string;
    step?: number;
    retryCount?: number;
    error?: string;
  }): void {
    const stmt = db.prepare(`
      INSERT INTO agent_runs (id, case_id, agent_name, status, started_at, completed_at, summary, review_id, step, retry_count, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      run.id,
      run.caseId,
      run.agentName,
      run.status,
      run.startedAt,
      run.completedAt || null,
      run.summary || null,
      run.reviewId || null,
      run.step || 0,
      run.retryCount || 0,
      run.error || null
    );
  }

  static findByCaseId(caseId: string): AgentRun[] {
    const stmt = db.prepare('SELECT * FROM agent_runs WHERE case_id = ? ORDER BY started_at ASC');
    return stmt.all(caseId) as AgentRun[];
  }
}

export class AgentFindingRepository {
  static create(finding: AgentFinding): void {
    const stmt = db.prepare(`
      INSERT INTO agent_findings (id, run_id, case_id, agent_name, severity, category, description, passed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      finding.id,
      finding.runId || null,
      finding.caseId,
      finding.agentName,
      finding.severity,
      finding.category,
      finding.description,
      finding.passed ? 1 : 0,
      finding.createdAt
    );
  }

  static findByCaseId(caseId: string): AgentFinding[] {
    const stmt = db.prepare('SELECT * FROM agent_findings WHERE case_id = ? ORDER BY created_at ASC');
    return stmt.all(caseId) as AgentFinding[];
  }
}

export class CaseReviewRepository {
  static create(review: {
    reviewId: string;
    caseId: string;
    workflowStatus: string;
    autonomyMode: string;
    recommendation: any;
    executionTrace: any[];
    agentResults: any[];
    createdAt: string;
    completedAt: string;
  }): void {
    const stmt = db.prepare(`
      INSERT INTO case_reviews (
        id,
        case_id,
        workflow_status,
        autonomy_mode,
        recommendation,
        confidence,
        rationale,
        key_reasons_json,
        agent_results_json,
        execution_trace_json,
        created_at,
        completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      review.reviewId,
      review.caseId,
      review.workflowStatus,
      review.autonomyMode,
      review.recommendation?.recommendation || null,
      review.recommendation?.confidence ?? null,
      review.recommendation?.rationale || null,
      JSON.stringify(review.recommendation?.keyReasons || []),
      JSON.stringify(review.agentResults),
      JSON.stringify(review.executionTrace),
      review.createdAt,
      review.completedAt
    );
  }

  static findById(reviewId: string): any | null {
    const stmt = db.prepare('SELECT * FROM case_reviews WHERE id = ?');
    const row = stmt.get(reviewId) as any;
    if (!row) {
      return null;
    }

    return {
      reviewId: row.id,
      caseId: row.case_id,
      workflowStatus: row.workflow_status,
      autonomyMode: row.autonomy_mode,
      recommendation: row.recommendation
        ? {
            recommendation: row.recommendation,
            confidence: row.confidence,
            rationale: row.rationale,
            keyReasons: JSON.parse(row.key_reasons_json || '[]'),
          }
        : null,
      agentResults: JSON.parse(row.agent_results_json || '[]'),
      executionTrace: JSON.parse(row.execution_trace_json || '[]'),
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  }

  static findByCaseId(caseId: string): any[] {
    const stmt = db.prepare('SELECT * FROM case_reviews WHERE case_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(caseId) as any[];
    return rows.map((row) => ({
      reviewId: row.id,
      caseId: row.case_id,
      workflowStatus: row.workflow_status,
      autonomyMode: row.autonomy_mode,
      recommendation: row.recommendation
        ? {
            recommendation: row.recommendation,
            confidence: row.confidence,
            rationale: row.rationale,
            keyReasons: JSON.parse(row.key_reasons_json || '[]'),
          }
        : null,
      agentResults: JSON.parse(row.agent_results_json || '[]'),
      executionTrace: JSON.parse(row.execution_trace_json || '[]'),
      createdAt: row.created_at,
      completedAt: row.completed_at,
    }));
  }
}
