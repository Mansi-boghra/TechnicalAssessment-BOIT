import express, { Express } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Mount API router under /api
  app.use('/api', apiRouter);

  return app;
}
