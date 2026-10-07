import { Router, Request, Response } from 'express';
import { OnboardingService } from '../services/index.js';
import { CreateCaseInput } from '../types/index.js';

export const caseRouter = Router();

/**
 * GET /api/cases
 * Returns all synthetic onboarding cases
 */
caseRouter.get('/cases', (_req: Request, res: Response) => {
  try {
    const cases = OnboardingService.getCases();
    res.status(200).json(cases);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: `Failed to retrieve cases: ${message}`,
    });
  }
});

/**
 * GET /api/cases/:id
 * Returns a specific synthetic onboarding case by ID
 */
caseRouter.get('/cases/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const foundCase = OnboardingService.getCaseById(id);

    if (!foundCase) {
      res.status(404).json({
        error: 'Not Found',
        message: `Onboarding case not found with ID '${id}'`,
      });
      return;
    }

    res.status(200).json(foundCase);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: `Failed to retrieve case: ${message}`,
    });
  }
});

/**
 * POST /api/cases
 * Validates and creates a new synthetic onboarding case
 */
caseRouter.post('/cases', (req: Request, res: Response) => {
  try {
    const validation = OnboardingService.validateCaseInput(req.body);

    if (!validation.valid) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid onboarding case payload. Please resolve all validation errors.',
        details: validation.errors,
      });
      return;
    }

    const created = OnboardingService.createCase(req.body as CreateCaseInput);
    res.status(201).json(created);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: `Failed to create onboarding case: ${message}`,
    });
  }
});
