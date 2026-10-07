import { SyntheticApplicant } from '../types/index.js';

/**
 * Synthetic test data strictly for assessment demonstration purposes.
 * Contains no real banking or customer information.
 */
export const SYNTHETIC_APPLICANTS: SyntheticApplicant[] = [
  {
    id: 'syn-app-001',
    applicantRef: 'APP-1001-SYNTH',
    fullName: 'Alex Sample River',
    country: 'Country-X',
    riskScore: 12,
    syntheticKycStatus: 'VERIFIED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'syn-app-002',
    applicantRef: 'APP-1002-SYNTH',
    fullName: 'Jordan Demo Taylor',
    country: 'Country-Y',
    riskScore: 78,
    syntheticKycStatus: 'FLAGGED',
    createdAt: new Date().toISOString(),
  },
];
