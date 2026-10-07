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
  static create(run: AgentRun): void {
    const stmt = db.prepare(`
      INSERT INTO agent_runs (id, case_id, agent_name, status, started_at, completed_at, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      run.id,
      run.caseId,
      run.agentName,
      run.status,
      run.startedAt,
      run.completedAt || null,
      run.summary || null
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
