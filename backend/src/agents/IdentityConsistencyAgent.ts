import { BaseAgent } from './base.js';
import { AgentFinding, AgentResult } from './types.js';
import { OnboardingCase } from '../types/index.js';

export class IdentityConsistencyAgent extends BaseAgent<OnboardingCase, AgentResult> {
  readonly name = 'IdentityConsistencyAgent';
  readonly goal = 'Detect inconsistencies between customer-declared data and identity data.';
  readonly responsibility =
    'Cross-references declared applicant profile fields against official identity document credentials to detect identity mismatches, document expiry, or data anomalies.';

  protected async evaluate(input: OnboardingCase, startedAt: string): Promise<AgentResult> {
    const findings: AgentFinding[] = [];
    const profile = input.customerProfile;
    const identity = input.identityDetails;

    // NOTE FOR FUTURE LLM ENHANCEMENT:
    // An LLM can perform fuzzy name matching, phonetic transliteration analysis (e.g., soundex / Levenshtein
    // across multilingual script variations), and contextual passport MRZ vs visual inspection.

    // 1. Missing identity data check
    if (!identity.documentNumber || identity.documentNumber.trim() === '') {
      findings.push({
        code: 'IDENT_DOC_NUMBER_MISSING',
        severity: 'CRITICAL',
        message: 'Identity document number is missing from identity record.',
        evidence: [`Document type: ${identity.documentType}`],
      });
    }

    if (!identity.issuingCountry || identity.issuingCountry.trim() === '') {
      findings.push({
        code: 'IDENT_ISSUING_COUNTRY_MISSING',
        severity: 'HIGH',
        message: 'Issuing country is missing from identity record.',
        evidence: [`Document number: ${identity.documentNumber}`],
      });
    }

    // 2. Name consistency check (Declared name vs Customer Profile firstName + lastName)
    const declaredNameClean = (identity.declaredName || '').trim().toLowerCase();
    const customerFullName = `${profile.firstName} ${profile.lastName}`.trim().toLowerCase();

    if (!declaredNameClean) {
      findings.push({
        code: 'IDENT_DECLARED_NAME_MISSING',
        severity: 'HIGH',
        message: 'No declared name present on identity document record.',
        evidence: [`Customer profile name: ${profile.firstName} ${profile.lastName}`],
      });
    } else if (declaredNameClean !== customerFullName) {
      // Check token overlap (e.g. middle name omission, name ordering)
      const declaredWords = declaredNameClean.split(/\s+/).filter(Boolean);
      const profileWords = customerFullName.split(/\s+/).filter(Boolean);
      const overlapWords = declaredWords.filter((w) => profileWords.includes(w));

      if (overlapWords.length >= 1) {
        findings.push({
          code: 'IDENT_NAME_VARIATION',
          severity: 'MEDIUM',
          message: `Minor name discrepancy detected: Declared name '${identity.declaredName}' contains matching name tokens but differs from profile '${profile.firstName} ${profile.lastName}' (possible middle name omission).`,
          evidence: [
            `Declared ID Name: "${identity.declaredName}"`,
            `Customer Profile: "${profile.firstName} ${profile.lastName}"`,
            `Matching Name Parts: ${overlapWords.join(', ')}`,
          ],
        });
      } else {
        findings.push({
          code: 'IDENT_NAME_MISMATCH',
          severity: 'HIGH',
          message: `Material name mismatch between identity document and customer application profile.`,
          evidence: [
            `Declared ID Name: "${identity.declaredName}"`,
            `Customer Profile: "${profile.firstName} ${profile.lastName}"`,
          ],
        });
      }
    }

    // 3. Expiry date check
    if (identity.expiryDate) {
      const expiry = new Date(identity.expiryDate);
      const now = new Date();
      if (!isNaN(expiry.getTime()) && expiry < now) {
        findings.push({
          code: 'IDENT_DOC_EXPIRED',
          severity: 'HIGH',
          message: `Identity document has expired on ${identity.expiryDate}.`,
          evidence: [`Document Expiry: ${identity.expiryDate}`, `Current Timestamp: ${now.toISOString()}`],
        });
      }
    }

    // 4. Nationality vs Issuing Country consistency check
    // (Informational / contextual check: foreign passport holding is acceptable in banking, but flagged if disparate)
    if (
      profile.nationality &&
      identity.issuingCountry &&
      profile.nationality.trim().toUpperCase() !== identity.issuingCountry.trim().toUpperCase()
    ) {
      findings.push({
        code: 'IDENT_NATIONALITY_JURISDICTION_DISPARITY',
        severity: 'LOW',
        message: `Applicant nationality ('${profile.nationality}') differs from ID issuing jurisdiction ('${identity.issuingCountry}'). Cross-border verification required.`,
        evidence: [
          `Declared Nationality: ${profile.nationality}`,
          `ID Issuing Country: ${identity.issuingCountry}`,
        ],
      });
    }

    // Summary & confidence
    const hasCritical = findings.some((f) => f.severity === 'CRITICAL');
    const hasHigh = findings.some((f) => f.severity === 'HIGH');
    const hasMedium = findings.some((f) => f.severity === 'MEDIUM');

    let confidence = 0.96;
    let summary: string;

    if (hasCritical || hasHigh) {
      confidence = 0.94;
      summary = `Identity discrepancies identified: Name mismatch, expired credentials, or missing primary attributes.`;
    } else if (hasMedium) {
      confidence = 0.90;
      summary = `Minor name formatting or middle-name omission detected between application profile and identity document.`;
    } else {
      findings.push({
        code: 'IDENT_VERIFIED_CONSISTENT',
        severity: 'INFO',
        message: 'Customer declared profile data exactly matches identity credential documentation.',
        evidence: [`Verified full name: ${profile.firstName} ${profile.lastName}`],
      });
      summary = `Identity credentials match customer declared application details consistently with active validity.`;
    }

    const completedAt = new Date().toISOString();

    return {
      agentName: this.name,
      status: 'COMPLETED',
      findings,
      confidence,
      summary,
      startedAt,
      completedAt,
    };
  }

  protected createFailureResult(reason: string, startedAt: string, completedAt: string): AgentResult {
    return {
      agentName: this.name,
      status: 'FAILED',
      findings: [
        {
          code: 'AGENT_EXECUTION_FAILURE',
          severity: 'CRITICAL',
          message: `IdentityConsistencyAgent failed during execution: ${reason}`,
          evidence: [reason],
        },
      ],
      confidence: 0,
      summary: `Execution error in IdentityConsistencyAgent: ${reason}`,
      startedAt,
      completedAt,
      failureReason: reason,
    };
  }
}
