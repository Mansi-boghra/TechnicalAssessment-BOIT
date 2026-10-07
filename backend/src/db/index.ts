import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/onboarding.db';
const resolvedDbDir = path.dirname(path.resolve(process.cwd(), dbPath));

if (!fs.existsSync(resolvedDbDir)) {
  fs.mkdirSync(resolvedDbDir, { recursive: true });
}

export const db: Database.Database = new Database(path.resolve(process.cwd(), dbPath));

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

/**
 * Initializes database schema for synthetic onboarding cases
 */
export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS synthetic_applicants (
      id TEXT PRIMARY KEY,
      applicantRef TEXT NOT NULL UNIQUE,
      fullName TEXT NOT NULL,
      country TEXT NOT NULL,
      riskScore INTEGER NOT NULL,
      syntheticKycStatus TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_cases (
      id TEXT PRIMARY KEY,
      applicantId TEXT NOT NULL,
      status TEXT NOT NULL,
      overallRisk TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (applicantId) REFERENCES synthetic_applicants(id)
    );
  `);
}
