import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { caseRouter } from './case.routes.js';

export const apiRouter = Router();

apiRouter.use('/', healthRouter);
apiRouter.use('/', caseRouter);
