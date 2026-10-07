import { describe, it, expect } from 'vitest';
import {
  DocumentCompletenessAgent,
  IdentityConsistencyAgent,
  RiskIndicatorAgent,
  RecommendationAgent,
} from '../src/agents/index.js';
import { SYNTHETIC_SEED_CASES } from '../src/data/seedData.js';

describe('Multi-Agent Banking Onboarding Workflow', () => {
  const lowRiskCase = SYNTHETIC_SEED_CASES.find((c) => c.riskTier === 'LOW')!;
  const mediumRiskCase = SYNTHETIC_SEED_CASES.find((c) => c.riskTier === 'MEDIUM')!;
  const highRiskCase = SYNTHETIC_SEED_CASES.find((c) => c.riskTier === 'HIGH')!;

  const docAgent = new DocumentCompletenessAgent();
  const identityAgent = new IdentityConsistencyAgent();
  const riskAgent = new RiskIndicatorAgent();
  const recommendationAgent = new RecommendationAgent();

  describe('Agent Contract Verification', () => {
    it('every agent should have unique name, goal, and responsibility', () => {
      const agents = [docAgent, identityAgent, riskAgent, recommendationAgent];
      const names = new Set(agents.map((a) => a.name));

      expect(names.size).toBe(4);
      for (const a of agents) {
        expect(a.goal).toBeDefined();
        expect(a.goal.length).toBeGreaterThan(10);
        expect(a.responsibility).toBeDefined();
        expect(a.responsibility.length).toBeGreaterThan(10);
      }
    });
  });

  describe('DocumentCompletenessAgent', () => {
    it('should verify complete documents for low-risk case', async () => {
      const result = await docAgent.execute(lowRiskCase);

      expect(result.agentName).toBe('DocumentCompletenessAgent');
      expect(result.status).toBe('COMPLETED');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.findings.some((f) => f.code === 'DOC_COMPLETE')).toBe(true);
      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
    });

    it('should detect missing proof of address document for medium-risk case', async () => {
      const result = await docAgent.execute(mediumRiskCase);

      expect(result.agentName).toBe('DocumentCompletenessAgent');
      expect(result.status).toBe('COMPLETED');
      expect(result.findings.some((f) => f.code === 'DOC_ADDRESS_STATUS_MISSING')).toBe(true);
    });
  });

  describe('IdentityConsistencyAgent', () => {
    it('should verify consistent identity for low-risk case', async () => {
      const result = await identityAgent.execute(lowRiskCase);

      expect(result.agentName).toBe('IdentityConsistencyAgent');
      expect(result.status).toBe('COMPLETED');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.findings.some((f) => f.code === 'IDENT_VERIFIED_CONSISTENT')).toBe(true);
    });

    it('should detect minor name variation for medium-risk case', async () => {
      const result = await identityAgent.execute(mediumRiskCase);

      expect(result.agentName).toBe('IdentityConsistencyAgent');
      expect(result.status).toBe('COMPLETED');
      expect(result.findings.some((f) => f.code === 'IDENT_NAME_VARIATION')).toBe(true);
    });
  });

  describe('RiskIndicatorAgent', () => {
    it('should confirm clean risk profile for low-risk case', async () => {
      const result = await riskAgent.execute(lowRiskCase);

      expect(result.agentName).toBe('RiskIndicatorAgent');
      expect(result.status).toBe('COMPLETED');
      expect(result.findings.some((f) => f.code === 'RISK_CLEAN_PROFILE')).toBe(true);
    });

    it('should identify simulated sanctions and PEP flags for high-risk case', async () => {
      const result = await riskAgent.execute(highRiskCase);

      expect(result.agentName).toBe('RiskIndicatorAgent');
      expect(result.status).toBe('COMPLETED');
      expect(result.findings.some((f) => f.code === 'RISK_SANCTIONS_MATCH')).toBe(true);
      expect(result.findings.some((f) => f.code === 'RISK_PEP_MATCH')).toBe(true);
    });
  });

  describe('RecommendationAgent', () => {
    it('should recommend APPROVE for low-risk case when all specialists are clean', async () => {
      const docRes = await docAgent.execute(lowRiskCase);
      const identRes = await identityAgent.execute(lowRiskCase);
      const riskRes = await riskAgent.execute(lowRiskCase);

      const decision = await recommendationAgent.execute({
        onboardingCase: lowRiskCase,
        specialistResults: [docRes, identRes, riskRes],
      });

      expect(decision.agentName).toBe('RecommendationAgent');
      expect(decision.status).toBe('COMPLETED');
      expect(decision.recommendation).toBe('APPROVE');
      expect(decision.confidence).toBeGreaterThanOrEqual(0.9);
      expect(decision.rationale).toContain('APPROVAL');
      expect(decision.keyReasons.length).toBeGreaterThan(0);
      expect(decision.generatedAt).toBeDefined();
    });

    it('should recommend MANUAL_REVIEW for medium-risk case with missing doc and name variation', async () => {
      const docRes = await docAgent.execute(mediumRiskCase);
      const identRes = await identityAgent.execute(mediumRiskCase);
      const riskRes = await riskAgent.execute(mediumRiskCase);

      const decision = await recommendationAgent.execute({
        onboardingCase: mediumRiskCase,
        specialistResults: [docRes, identRes, riskRes],
      });

      expect(decision.agentName).toBe('RecommendationAgent');
      expect(decision.status).toBe('COMPLETED');
      expect(decision.recommendation).toBe('MANUAL_REVIEW');
      expect(decision.rationale).toContain('MANUAL_REVIEW');
    });

    it('should recommend REJECT for high-risk case with sanctions match', async () => {
      const docRes = await docAgent.execute(highRiskCase);
      const identRes = await identityAgent.execute(highRiskCase);
      const riskRes = await riskAgent.execute(highRiskCase);

      const decision = await recommendationAgent.execute({
        onboardingCase: highRiskCase,
        specialistResults: [docRes, identRes, riskRes],
      });

      expect(decision.agentName).toBe('RecommendationAgent');
      expect(decision.status).toBe('COMPLETED');
      expect(decision.recommendation).toBe('REJECT');
      expect(decision.keyReasons.some((r) => r.includes('sanctions'))).toBe(true);
    });
  });
});
