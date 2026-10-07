import crypto from 'crypto';
import { CaseRepository } from '../models/index.js';
import { OnboardingCase, CreateCaseInput, RiskLevel } from '../types/index.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class OnboardingService {
  /**
   * Retrieves all onboarding cases
   */
  static getCases(): OnboardingCase[] {
    return CaseRepository.findAll();
  }

  /**
   * Retrieves a single onboarding case by ID
   */
  static getCaseById(id: string): OnboardingCase | null {
    if (!id || typeof id !== 'string') {
      return null;
    }
    return CaseRepository.findById(id);
  }

  /**
   * Validates the structure and required fields of an incoming onboarding case payload
   */
  static validateCaseInput(data: unknown): ValidationResult {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Case payload must be a non-null object'] };
    }

    const payload = data as Record<string, any>;

    // 1. Customer Profile
    if (!payload.customerProfile || typeof payload.customerProfile !== 'object') {
      errors.push('customerProfile is required and must be an object');
    } else {
      const { firstName, lastName, dateOfBirth, nationality, customerType } = payload.customerProfile;
      if (!firstName || typeof firstName !== 'string') errors.push('customerProfile.firstName is required');
      if (!lastName || typeof lastName !== 'string') errors.push('customerProfile.lastName is required');
      if (!dateOfBirth || typeof dateOfBirth !== 'string') errors.push('customerProfile.dateOfBirth is required');
      if (!nationality || typeof nationality !== 'string') errors.push('customerProfile.nationality is required');
      if (!customerType || !['INDIVIDUAL', 'BUSINESS'].includes(customerType)) {
        errors.push('customerProfile.customerType must be either INDIVIDUAL or BUSINESS');
      }
    }

    // 2. Identity Details
    if (!payload.identityDetails || typeof payload.identityDetails !== 'object') {
      errors.push('identityDetails is required and must be an object');
    } else {
      const { documentType, documentNumber, issuingCountry, expiryDate, declaredName } = payload.identityDetails;
      if (!documentType || typeof documentType !== 'string') errors.push('identityDetails.documentType is required');
      if (!documentNumber || typeof documentNumber !== 'string') errors.push('identityDetails.documentNumber is required');
      if (!issuingCountry || typeof issuingCountry !== 'string') errors.push('identityDetails.issuingCountry is required');
      if (!expiryDate || typeof expiryDate !== 'string') errors.push('identityDetails.expiryDate is required');
      if (!declaredName || typeof declaredName !== 'string') errors.push('identityDetails.declaredName is required');
    }

    // 3. Address Details
    if (!payload.addressDetails || typeof payload.addressDetails !== 'object') {
      errors.push('addressDetails is required and must be an object');
    } else {
      const { street, city, provinceOrState, postalCode, country } = payload.addressDetails;
      if (!street || typeof street !== 'string') errors.push('addressDetails.street is required');
      if (!city || typeof city !== 'string') errors.push('addressDetails.city is required');
      if (!provinceOrState || typeof provinceOrState !== 'string') errors.push('addressDetails.provinceOrState is required');
      if (!postalCode || typeof postalCode !== 'string') errors.push('addressDetails.postalCode is required');
      if (!country || typeof country !== 'string') errors.push('addressDetails.country is required');
    }

    // 4. Employment Details
    if (!payload.employmentDetails || typeof payload.employmentDetails !== 'object') {
      errors.push('employmentDetails is required and must be an object');
    } else {
      const { status, employerName, occupation, annualIncome } = payload.employmentDetails;
      if (!status || typeof status !== 'string') errors.push('employmentDetails.status is required');
      if (!employerName || typeof employerName !== 'string') errors.push('employmentDetails.employerName is required');
      if (!occupation || typeof occupation !== 'string') errors.push('employmentDetails.occupation is required');
      if (typeof annualIncome !== 'number' || isNaN(annualIncome)) {
        errors.push('employmentDetails.annualIncome must be a valid number');
      }
    }

    // 5. Supporting Documents
    if (!Array.isArray(payload.supportingDocuments)) {
      errors.push('supportingDocuments is required and must be an array');
    } else {
      payload.supportingDocuments.forEach((doc: any, index: number) => {
        if (!doc || typeof doc !== 'object') {
          errors.push(`supportingDocuments[${index}] must be an object`);
        } else {
          if (!doc.type) errors.push(`supportingDocuments[${index}].type is required`);
          if (!doc.documentName) errors.push(`supportingDocuments[${index}].documentName is required`);
          if (!doc.status || !['PROVIDED', 'MISSING', 'EXPIRED'].includes(doc.status)) {
            errors.push(`supportingDocuments[${index}].status must be PROVIDED, MISSING, or EXPIRED`);
          }
        }
      });
    }

    // 6. Risk Indicators
    if (!payload.riskIndicators || typeof payload.riskIndicators !== 'object') {
      errors.push('riskIndicators is required and must be an object');
    } else {
      const { pepFlag, sanctionsFlag, highRiskCountry, unusualIncomeFlag } = payload.riskIndicators;
      if (typeof pepFlag !== 'boolean') errors.push('riskIndicators.pepFlag must be a boolean');
      if (typeof sanctionsFlag !== 'boolean') errors.push('riskIndicators.sanctionsFlag must be a boolean');
      if (typeof highRiskCountry !== 'boolean') errors.push('riskIndicators.highRiskCountry must be a boolean');
      if (typeof unusualIncomeFlag !== 'boolean') errors.push('riskIndicators.unusualIncomeFlag must be a boolean');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Creates and persists a synthetic onboarding case
   */
  static createCase(caseData: CreateCaseInput): OnboardingCase {
    const timestamp = new Date().toISOString();
    const generatedId = caseData.id || `case-synth-${crypto.randomUUID()}`;
    const generatedCaseNumber =
      caseData.caseNumber || `CASE-SYNTH-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Compute synthetic risk tier if not explicitly provided
    let calculatedRiskTier: RiskLevel = caseData.riskTier || 'LOW';
    if (!caseData.riskTier && caseData.riskIndicators) {
      if (caseData.riskIndicators.sanctionsFlag || caseData.riskIndicators.pepFlag || caseData.riskIndicators.highRiskCountry) {
        calculatedRiskTier = 'HIGH';
      } else if (
        caseData.riskIndicators.unusualIncomeFlag ||
        caseData.supportingDocuments?.some((doc) => doc.status !== 'PROVIDED')
      ) {
        calculatedRiskTier = 'MEDIUM';
      }
    }

    // Ensure supporting documents have unique IDs
    const normalizedDocs = (caseData.supportingDocuments || []).map((doc, idx) => ({
      ...doc,
      id: doc.id || `doc-${idx + 1}-${crypto.randomBytes(2).toString('hex')}`,
    }));

    const newCase: OnboardingCase = {
      id: generatedId,
      caseNumber: generatedCaseNumber,
      status: caseData.status || 'PENDING',
      riskTier: calculatedRiskTier,
      isSynthetic: true, // ALWAYS synthetic
      customerProfile: caseData.customerProfile,
      identityDetails: caseData.identityDetails,
      addressDetails: caseData.addressDetails,
      employmentDetails: caseData.employmentDetails,
      supportingDocuments: normalizedDocs,
      riskIndicators: caseData.riskIndicators,
      notes: caseData.notes || '[SYNTHETIC TEST RECORD - NO REAL DATA]',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return CaseRepository.create(newCase);
  }
}

// Convenience export matching the exact method names in the user requirements
export const getCases = OnboardingService.getCases;
export const getCaseById = OnboardingService.getCaseById;
export const createCase = OnboardingService.createCase;
