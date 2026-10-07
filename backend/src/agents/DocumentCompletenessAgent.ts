import { BaseAgent } from './base.js';
import { AgentFinding, AgentResult } from './types.js';
import { OnboardingCase } from '../types/index.js';

export class DocumentCompletenessAgent extends BaseAgent<OnboardingCase, AgentResult> {
  readonly name = 'DocumentCompletenessAgent';
  readonly goal = 'Determine whether mandatory onboarding documentation is available and usable.';
  readonly responsibility =
    'Inspects supporting documents against mandatory banking KYC requirements, verifying government ID and address proofs, identifying missing or expired files.';

  protected async evaluate(input: OnboardingCase, startedAt: string): Promise<AgentResult> {
    const findings: AgentFinding[] = [];
    const docs = input.supportingDocuments || [];

    // NOTE FOR FUTURE LLM ENHANCEMENT:
    // A multimodal vision LLM (e.g. GPT-4o, Gemini Flash Vision) could receive raw document images/PDFs here,
    // perform OCR, check holograms/watermarks, and emit structured JSON matching these exact findings.

    // 1. Check for primary identity document
    const idDoc = docs.find(
      (d) =>
        d.type.toUpperCase().includes('ID') ||
        d.type.toUpperCase().includes('PASSPORT') ||
        d.type.toUpperCase().includes('GOVERNMENT')
    );

    if (!idDoc) {
      findings.push({
        code: 'DOC_ID_MISSING',
        severity: 'CRITICAL',
        message: 'No mandatory government-issued photo identity document provided.',
        evidence: ['Required document type: GOVERNMENT_ID or PASSPORT', `Documents submitted: ${docs.length}`],
      });
    } else if (idDoc.status === 'MISSING') {
      findings.push({
        code: 'DOC_ID_STATUS_MISSING',
        severity: 'CRITICAL',
        message: 'Government identity document record exists but file status is marked as MISSING.',
        evidence: [`Document: ${idDoc.documentName}`, `Status: ${idDoc.status}`],
      });
    } else if (idDoc.status === 'EXPIRED') {
      findings.push({
        code: 'DOC_ID_EXPIRED',
        severity: 'HIGH',
        message: 'Primary government identity document provided has expired.',
        evidence: [`Document: ${idDoc.documentName}`, `Status: EXPIRED`],
      });
    }

    // 2. Check for proof of address document
    const addressDoc = docs.find(
      (d) =>
        d.type.toUpperCase().includes('ADDRESS') ||
        d.type.toUpperCase().includes('UTILITY') ||
        d.type.toUpperCase().includes('STATEMENT')
    );

    if (!addressDoc) {
      findings.push({
        code: 'DOC_ADDRESS_MISSING',
        severity: 'HIGH',
        message: 'Mandatory proof of residential address document is missing.',
        evidence: ['Required document type: PROOF_OF_ADDRESS or UTILITY_BILL'],
      });
    } else if (addressDoc.status === 'MISSING') {
      findings.push({
        code: 'DOC_ADDRESS_STATUS_MISSING',
        severity: 'HIGH',
        message: 'Proof of address document is required but status is currently MISSING.',
        evidence: [`Document: ${addressDoc.documentName}`, `Status: ${addressDoc.status}`],
      });
    } else if (addressDoc.status === 'EXPIRED') {
      findings.push({
        code: 'DOC_ADDRESS_EXPIRED',
        severity: 'MEDIUM',
        message: 'Proof of address document exceeds allowable validity window (EXPIRED).',
        evidence: [`Document: ${addressDoc.documentName}`, `Status: EXPIRED`],
      });
    }

    // 3. Scan for any other expired or missing documents
    for (const doc of docs) {
      if (doc !== idDoc && doc !== addressDoc) {
        if (doc.status === 'EXPIRED') {
          findings.push({
            code: 'DOC_ANCILLARY_EXPIRED',
            severity: 'MEDIUM',
            message: `Supporting document '${doc.documentName}' is expired.`,
            evidence: [`Document ID: ${doc.id}`, `Type: ${doc.type}`],
          });
        } else if (doc.status === 'MISSING') {
          findings.push({
            code: 'DOC_ANCILLARY_MISSING',
            severity: 'LOW',
            message: `Supporting document '${doc.documentName}' is marked as missing.`,
            evidence: [`Document ID: ${doc.id}`, `Type: ${doc.type}`],
          });
        }
      }
    }

    // Calculate confidence and summary
    const hasCritical = findings.some((f) => f.severity === 'CRITICAL');
    const hasHigh = findings.some((f) => f.severity === 'HIGH');
    const hasMedium = findings.some((f) => f.severity === 'MEDIUM');

    let confidence = 0.95;
    let summary: string;

    if (hasCritical) {
      confidence = 0.99;
      summary = `Critical documentation deficiency: Missing mandatory government identification.`;
    } else if (hasHigh) {
      confidence = 0.92;
      summary = `Documentation incomplete: Key required documents (such as proof of address) are missing or expired.`;
    } else if (hasMedium) {
      confidence = 0.90;
      summary = `Ancillary documentation issues detected requiring review.`;
    } else {
      findings.push({
        code: 'DOC_COMPLETE',
        severity: 'INFO',
        message: 'All mandatory onboarding documentation (Identity & Address) is provided and currently valid.',
        evidence: [`Verified ${docs.length} submitted document(s)`],
      });
      summary = `All mandatory documents (Identity & Address verification) are present, verified, and unexpired.`;
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
          message: `DocumentCompletenessAgent failed during execution: ${reason}`,
          evidence: [reason],
        },
      ],
      confidence: 0,
      summary: `Execution error in DocumentCompletenessAgent: ${reason}`,
      startedAt,
      completedAt,
      failureReason: reason,
    };
  }
}
