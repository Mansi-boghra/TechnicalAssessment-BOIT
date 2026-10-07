import { OnboardingCase } from '../types/index.js';

/**
 * Synthetic Onboarding Case Test Dataset
 * STRICTLY SYNTHETIC DATA - Contains zero real customer or banking information.
 * Used exclusively for technical assessment demonstration and automated testing.
 */
export const SYNTHETIC_SEED_CASES: OnboardingCase[] = [
  // 1. Low-Risk Case
  {
    id: 'case-synth-001',
    caseNumber: 'CASE-SYNTH-001',
    status: 'PENDING',
    riskTier: 'LOW',
    isSynthetic: true,
    customerProfile: {
      firstName: 'Eleanor',
      lastName: 'Vance',
      dateOfBirth: '1988-04-12',
      nationality: 'CA',
      customerType: 'INDIVIDUAL',
    },
    identityDetails: {
      documentType: 'PASSPORT',
      documentNumber: 'SYN-PASS-78901',
      issuingCountry: 'CA',
      expiryDate: '2031-08-20',
      declaredName: 'Eleanor Vance',
    },
    addressDetails: {
      street: '124 Maple Avenue',
      city: 'Toronto',
      provinceOrState: 'Ontario',
      postalCode: 'M5V 2T6',
      country: 'CA',
    },
    employmentDetails: {
      status: 'EMPLOYED',
      employerName: 'Northern Tech Labs',
      occupation: 'Senior Software Engineer',
      annualIncome: 145000,
    },
    supportingDocuments: [
      {
        id: 'doc-001-id',
        type: 'GOVERNMENT_ID',
        status: 'PROVIDED',
        documentName: 'synthetic_passport_scan.pdf',
      },
      {
        id: 'doc-001-addr',
        type: 'PROOF_OF_ADDRESS',
        status: 'PROVIDED',
        documentName: 'synthetic_utility_bill.pdf',
      },
    ],
    riskIndicators: {
      pepFlag: false,
      sanctionsFlag: false,
      highRiskCountry: false,
      unusualIncomeFlag: false,
    },
    notes: '[SYNTHETIC TEST RECORD - NO REAL DATA] Complete documentation, consistent declared identity, and clear low-risk markers.',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
  },

  // 2. Medium-Risk Case
  {
    id: 'case-synth-002',
    caseNumber: 'CASE-SYNTH-002',
    status: 'PENDING',
    riskTier: 'MEDIUM',
    isSynthetic: true,
    customerProfile: {
      firstName: 'Marcus',
      lastName: 'Aurelius Sterling',
      dateOfBirth: '1995-11-03',
      nationality: 'GB',
      customerType: 'INDIVIDUAL',
    },
    identityDetails: {
      documentType: 'NATIONAL_ID',
      documentNumber: 'SYN-NID-44219',
      issuingCountry: 'GB',
      expiryDate: '2028-02-15',
      declaredName: 'Marcus Sterling', // Discrepancy: Middle name omitted from declared application name
    },
    addressDetails: {
      street: '42 High Street, Flat 3B',
      city: 'Edinburgh',
      provinceOrState: 'Scotland',
      postalCode: 'EH1 1YZ',
      country: 'GB',
    },
    employmentDetails: {
      status: 'SELF_EMPLOYED',
      employerName: 'Sterling Digital Consulting',
      occupation: 'Freelance Strategist',
      annualIncome: 88000,
    },
    supportingDocuments: [
      {
        id: 'doc-002-id',
        type: 'GOVERNMENT_ID',
        status: 'PROVIDED',
        documentName: 'synthetic_national_id.pdf',
      },
      {
        id: 'doc-002-addr',
        type: 'PROOF_OF_ADDRESS',
        status: 'MISSING', // Missing proof of address document
        documentName: 'synthetic_bank_statement.pdf',
      },
    ],
    riskIndicators: {
      pepFlag: false,
      sanctionsFlag: false,
      highRiskCountry: false,
      unusualIncomeFlag: true, // Fluctuating self-employed income flag
    },
    notes: '[SYNTHETIC TEST RECORD - NO REAL DATA] Missing utility bill proof-of-address and minor name omission between ID and declaration.',
    createdAt: '2026-10-02T11:30:00.000Z',
    updatedAt: '2026-10-02T11:30:00.000Z',
  },

  // 3. High-Risk Case
  {
    id: 'case-synth-003',
    caseNumber: 'CASE-SYNTH-003',
    status: 'PENDING',
    riskTier: 'HIGH',
    isSynthetic: true,
    customerProfile: {
      firstName: 'Viktor',
      lastName: 'Dmitriev',
      dateOfBirth: '1972-07-29',
      nationality: 'Synthetic-Jurisdiction-Z',
      customerType: 'INDIVIDUAL',
    },
    identityDetails: {
      documentType: 'PASSPORT',
      documentNumber: 'SYN-PASS-99014',
      issuingCountry: 'Synthetic-Jurisdiction-Z',
      expiryDate: '2026-12-31',
      declaredName: 'Viktor Dmitriev',
    },
    addressDetails: {
      street: '15 Harbor Boulevard',
      city: 'Capital City',
      provinceOrState: 'Province Central',
      postalCode: '99201',
      country: 'Synthetic-Jurisdiction-Z',
    },
    employmentDetails: {
      status: 'BUSINESS_OWNER',
      employerName: 'Volga Minerals Trading Ltd',
      occupation: 'Managing Director',
      annualIncome: 650000,
    },
    supportingDocuments: [
      {
        id: 'doc-003-id',
        type: 'GOVERNMENT_ID',
        status: 'PROVIDED',
        documentName: 'synthetic_passport_scan.pdf',
      },
      {
        id: 'doc-003-corp',
        type: 'ARTICLES_OF_INCORPORATION',
        status: 'PROVIDED',
        documentName: 'synthetic_corporate_registry.pdf',
      },
    ],
    riskIndicators: {
      pepFlag: true, // Politically Exposed Person simulation
      sanctionsFlag: true, // Sanctions watchlist simulation match
      highRiskCountry: true, // High risk jurisdiction match
      unusualIncomeFlag: true,
    },
    notes: '[SYNTHETIC TEST RECORD - NO REAL DATA] High-risk triggers: Simulated PEP indicator, sanction match, and high-risk jurisdiction.',
    createdAt: '2026-10-03T14:45:00.000Z',
    updatedAt: '2026-10-03T14:45:00.000Z',
  },
];
