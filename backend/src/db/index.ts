import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { SYNTHETIC_SEED_CASES } from '../data/seedData.js';
import { OnboardingCase } from '../types/index.js';

const dbPath = process.env.DATABASE_PATH || './data/onboarding.db';
const resolvedDbDir = path.dirname(path.resolve(process.cwd(), dbPath));

if (!fs.existsSync(resolvedDbDir)) {
  fs.mkdirSync(resolvedDbDir, { recursive: true });
}

export const db: Database.Database = new Database(path.resolve(process.cwd(), dbPath));

// Enable WAL mode and foreign key constraints
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initializes database relational tables
 */
export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      case_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_type TEXT NOT NULL,
      status TEXT NOT NULL,
      risk_tier TEXT NOT NULL,
      is_synthetic INTEGER NOT NULL DEFAULT 1,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      summary TEXT,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agent_findings (
      id TEXT PRIMARY KEY,
      run_id TEXT,
      case_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      severity TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      passed INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY (run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
    CREATE INDEX IF NOT EXISTS idx_cases_risk_tier ON cases(risk_tier);
    CREATE INDEX IF NOT EXISTS idx_agent_runs_case_id ON agent_runs(case_id);
    CREATE INDEX IF NOT EXISTS idx_agent_findings_case_id ON agent_findings(case_id);
  `);
}

/**
 * Seeds the database with synthetic onboarding cases if none exist
 */
export function seedDatabase(): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM cases').get() as { count: number };

  if (countRow.count === 0) {
    const insertStmt = db.prepare(`
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

    const insertMany = db.transaction((cases: OnboardingCase[]) => {
      for (const c of cases) {
        const customerName = `${c.customerProfile.firstName} ${c.customerProfile.lastName}`.trim();
        insertStmt.run(
          c.id,
          c.caseNumber,
          customerName,
          c.customerProfile.customerType,
          c.status,
          c.riskTier,
          c.isSynthetic ? 1 : 0,
          JSON.stringify(c),
          c.createdAt,
          c.updatedAt
        );
      }
    });

    insertMany(SYNTHETIC_SEED_CASES);
    console.log(`[Database] Successfully seeded ${SYNTHETIC_SEED_CASES.length} synthetic onboarding cases.`);
  }
}
