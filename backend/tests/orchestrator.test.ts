import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDatabase, seedDatabase } from '../src/db/index.js';

describe('Supervisor Orchestrator & Autonomy Workflow', () => {
  const app = createApp();

  beforeAll(() => {
    initDatabase();
    seedDatabase();
  });

  describe('POST /api/cases/:id/review', () => {
    it('low risk case (case-synth-001) in EXCEPTION_ONLY mode should auto-complete as COMPLETED with APPROVE', async () => {
      const response = await request(app)
        .post('/api/cases/case-synth-001/review')
        .send({ autonomyMode: 'EXCEPTION_ONLY' });

      expect(response.status).toBe(200);
      expect(response.body.reviewId).toBeDefined();
      expect(response.body.caseId).toBe('case-synth-001');
      expect(response.body.autonomyMode).toBe('EXCEPTION_ONLY');
      expect(response.body.recommendation.recommendation).toBe('APPROVE');
      expect(response.body.workflowStatus).toBe('COMPLETED');
      expect(response.body.agentResults.length).toBe(3);
      expect(response.body.executionTrace.length).toBe(4);

      // Verify execution trace steps
      const agentsInTrace = response.body.executionTrace.map((t: any) => t.agent);
      expect(agentsInTrace).toContain('DocumentCompletenessAgent');
      expect(agentsInTrace).toContain('IdentityConsistencyAgent');
      expect(agentsInTrace).toContain('RiskIndicatorAgent');
      expect(agentsInTrace).toContain('RecommendationAgent');

      // Verify each step has timestamps and retry information
      response.body.executionTrace.forEach((step: any) => {
        expect(step.status).toBe('COMPLETED');
        expect(step.retryCount).toBeDefined();
        expect(step.startedAt).toBeDefined();
        expect(step.completedAt).toBeDefined();
      });
    });

    it('low risk case (case-synth-001) in HUMAN_APPROVAL_REQUIRED mode should end in WAITING_FOR_HUMAN', async () => {
      const response = await request(app)
        .post('/api/cases/case-synth-001/review')
        .send({ autonomyMode: 'HUMAN_APPROVAL_REQUIRED' });

      expect(response.status).toBe(200);
      expect(response.body.recommendation.recommendation).toBe('APPROVE');
      expect(response.body.workflowStatus).toBe('WAITING_FOR_HUMAN');
      expect(response.body.autonomyMode).toBe('HUMAN_APPROVAL_REQUIRED');
    });

    it('medium risk case (case-synth-002) in EXCEPTION_ONLY mode should halt in WAITING_FOR_HUMAN with MANUAL_REVIEW', async () => {
      const response = await request(app)
        .post('/api/cases/case-synth-002/review')
        .send({ autonomyMode: 'EXCEPTION_ONLY' });

      expect(response.status).toBe(200);
      expect(response.body.caseId).toBe('case-synth-002');
      expect(response.body.recommendation.recommendation).toBe('MANUAL_REVIEW');
      expect(response.body.workflowStatus).toBe('WAITING_FOR_HUMAN');
    });

    it('high risk case (case-synth-003) in EXCEPTION_ONLY mode should halt in WAITING_FOR_HUMAN with REJECT', async () => {
      const response = await request(app)
        .post('/api/cases/case-synth-003/review')
        .send({ autonomyMode: 'EXCEPTION_ONLY' });

      expect(response.status).toBe(200);
      expect(response.body.caseId).toBe('case-synth-003');
      expect(response.body.recommendation.recommendation).toBe('REJECT');
      expect(response.body.workflowStatus).toBe('WAITING_FOR_HUMAN');
      expect(response.body.recommendation.keyReasons.some((r: string) => r.includes('sanctions'))).toBe(true);
    });

    it('should return 404 when case ID does not exist', async () => {
      const response = await request(app)
        .post('/api/cases/non-existent-case-id/review')
        .send({ autonomyMode: 'EXCEPTION_ONLY' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 400 when invalid autonomyMode is supplied', async () => {
      const response = await request(app)
        .post('/api/cases/case-synth-001/review')
        .send({ autonomyMode: 'INVALID_AUTONOMY_MODE' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/reviews/:reviewId', () => {
    it('should retrieve the complete persisted audit record for a review', async () => {
      // 1. Trigger review
      const runRes = await request(app)
        .post('/api/cases/case-synth-001/review')
        .send({ autonomyMode: 'EXCEPTION_ONLY' });
      const reviewId = runRes.body.reviewId;

      // 2. Fetch audit record
      const fetchRes = await request(app).get(`/api/reviews/${reviewId}`);

      expect(fetchRes.status).toBe(200);
      expect(fetchRes.body.reviewId).toBe(reviewId);
      expect(fetchRes.body.caseId).toBe('case-synth-001');
      expect(fetchRes.body.recommendation).toBeDefined();
      expect(fetchRes.body.executionTrace.length).toBe(4);
      expect(fetchRes.body.agentResults.length).toBe(3);
    });

    it('should return 404 for non-existent reviewId', async () => {
      const response = await request(app).get('/api/reviews/rev-non-existent-999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });
  });
});
