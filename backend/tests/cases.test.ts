import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDatabase, seedDatabase } from '../src/db/index.js';
import { CreateCaseInput } from '../src/types/index.js';

describe('Synthetic Onboarding Cases API', () => {
  const app = createApp();

  beforeAll(() => {
    initDatabase();
    seedDatabase();
  });

  describe('GET /api/cases', () => {
    it('should return a list of synthetic onboarding cases including the 3 seeded cases', async () => {
      const response = await request(app).get('/api/cases');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);

      const caseNumbers = response.body.map((c: any) => c.caseNumber);
      expect(caseNumbers).toContain('CASE-SYNTH-001');
      expect(caseNumbers).toContain('CASE-SYNTH-002');
      expect(caseNumbers).toContain('CASE-SYNTH-003');

      // Verify synthetic safeguard on all cases
      response.body.forEach((c: any) => {
        expect(c.isSynthetic).toBe(true);
      });
    });
  });

  describe('GET /api/cases/:id', () => {
    it('should return the low-risk synthetic case by ID', async () => {
      const response = await request(app).get('/api/cases/case-synth-001');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('case-synth-001');
      expect(response.body.riskTier).toBe('LOW');
      expect(response.body.customerProfile.firstName).toBe('Eleanor');
      expect(response.body.customerProfile.customerType).toBe('INDIVIDUAL');
      expect(response.body.supportingDocuments.length).toBe(2);
      expect(response.body.riskIndicators.pepFlag).toBe(false);
      expect(response.body.isSynthetic).toBe(true);
    });

    it('should return the high-risk synthetic case with risk flags', async () => {
      const response = await request(app).get('/api/cases/case-synth-003');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('case-synth-003');
      expect(response.body.riskTier).toBe('HIGH');
      expect(response.body.riskIndicators.pepFlag).toBe(true);
      expect(response.body.riskIndicators.sanctionsFlag).toBe(true);
      expect(response.body.isSynthetic).toBe(true);
    });

    it('should return 404 when case ID does not exist', async () => {
      const response = await request(app).get('/api/cases/non-existent-case-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('POST /api/cases', () => {
    it('should successfully create a new synthetic onboarding case', async () => {
      const newCaseData: CreateCaseInput = {
        customerProfile: {
          firstName: 'Maya',
          lastName: 'Lin',
          dateOfBirth: '1992-06-15',
          nationality: 'SG',
          customerType: 'INDIVIDUAL',
        },
        identityDetails: {
          documentType: 'PASSPORT',
          documentNumber: 'SYN-SG-88201',
          issuingCountry: 'SG',
          expiryDate: '2032-01-01',
          declaredName: 'Maya Lin',
        },
        addressDetails: {
          street: '88 Marina Boulevard',
          city: 'Singapore',
          provinceOrState: 'Central',
          postalCode: '018981',
          country: 'SG',
        },
        employmentDetails: {
          status: 'EMPLOYED',
          employerName: 'Global FinTech Corp',
          occupation: 'Data Scientist',
          annualIncome: 125000,
        },
        supportingDocuments: [
          {
            id: 'doc-maya-01',
            type: 'GOVERNMENT_ID',
            status: 'PROVIDED',
            documentName: 'synthetic_singapore_passport.pdf',
          },
        ],
        riskIndicators: {
          pepFlag: false,
          sanctionsFlag: false,
          highRiskCountry: false,
          unusualIncomeFlag: false,
        },
        notes: '[SYNTHETIC TEST RECORD - NO REAL DATA] Test case created via API test.',
      };

      const response = await request(app)
        .post('/api/cases')
        .send(newCaseData);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.caseNumber).toBeDefined();
      expect(response.body.isSynthetic).toBe(true);
      expect(response.body.customerProfile.firstName).toBe('Maya');
      expect(response.body.riskTier).toBe('LOW');

      // Verify the case can subsequently be retrieved via GET
      const getResponse = await request(app).get(`/api/cases/${response.body.id}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.customerProfile.lastName).toBe('Lin');
    });

    it('should return 400 with details when required fields are missing', async () => {
      const invalidData = {
        customerProfile: {
          firstName: 'Incomplete',
          // missing lastName, dateOfBirth, nationality, customerType
        },
        // missing identityDetails, addressDetails, employmentDetails, etc.
      };

      const response = await request(app)
        .post('/api/cases')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
      expect(Array.isArray(response.body.details)).toBe(true);
      expect(response.body.details.length).toBeGreaterThan(0);
    });
  });
});
