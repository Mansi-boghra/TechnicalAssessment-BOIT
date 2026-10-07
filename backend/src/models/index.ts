import { SyntheticApplicant, ReviewCase } from '../types/index.js';
import { db } from '../db/index.js';

/**
 * Synthetic applicant and review case data access models
 */
export class SyntheticApplicantModel {
  static findById(id: string): SyntheticApplicant | undefined {
    const stmt = db.prepare('SELECT * FROM synthetic_applicants WHERE id = ?');
    return stmt.get(id) as SyntheticApplicant | undefined;
  }

  static findAll(): SyntheticApplicant[] {
    const stmt = db.prepare('SELECT * FROM synthetic_applicants');
    return stmt.all() as SyntheticApplicant[];
  }

  static create(applicant: SyntheticApplicant): void {
    const stmt = db.prepare(`
      INSERT INTO synthetic_applicants (id, applicantRef, fullName, country, riskScore, syntheticKycStatus, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      applicant.id,
      applicant.applicantRef,
      applicant.fullName,
      applicant.country,
      applicant.riskScore,
      applicant.syntheticKycStatus,
      applicant.createdAt
    );
  }
}

export class ReviewCaseModel {
  static findById(id: string): ReviewCase | undefined {
    const stmt = db.prepare('SELECT * FROM review_cases WHERE id = ?');
    return stmt.get(id) as ReviewCase | undefined;
  }

  static findAll(): ReviewCase[] {
    const stmt = db.prepare('SELECT * FROM review_cases ORDER BY createdAt DESC');
    return stmt.all() as ReviewCase[];
  }

  static create(reviewCase: ReviewCase): void {
    const stmt = db.prepare(`
      INSERT INTO review_cases (id, applicantId, status, overallRisk, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      reviewCase.id,
      reviewCase.applicantId,
      reviewCase.status,
      reviewCase.overallRisk,
      reviewCase.notes || null,
      reviewCase.createdAt,
      reviewCase.updatedAt
    );
  }
}
