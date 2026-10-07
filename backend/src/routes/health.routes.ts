import { Router, Request, Response } from 'express';
import { HealthResponse } from '../types/index.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response<HealthResponse>) => {
  res.status(200).json({
    status: 'ok',
    service: 'multi-agent-onboarding-reviewer',
  });
});
