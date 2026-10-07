import { Router, Request, Response } from 'express';
import { OnboardingOrchestrator } from '../orchestrator/index.js';
import { AutonomyMode } from '../orchestrator/types.js';

export const reviewRouter = Router();
const orchestrator = new OnboardingOrchestrator();

/**
 * POST /api/cases/:id/review
 * Triggers supervisor multi-agent review workflow for an onboarding case
 */
reviewRouter.post('/cases/:id/review', async (req: Request, res: Response) => {
  try {
    const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const requestedMode = req.body?.autonomyMode;

    let autonomyMode: AutonomyMode = 'EXCEPTION_ONLY';
    if (requestedMode) {
      if (
        requestedMode !== 'HUMAN_APPROVAL_REQUIRED' &&
        requestedMode !== 'EXCEPTION_ONLY'
      ) {
        res.status(400).json({
          error: 'Validation Error',
          message:
            "Invalid autonomyMode. Must be either 'HUMAN_APPROVAL_REQUIRED' or 'EXCEPTION_ONLY'.",
        });
        return;
      }
      autonomyMode = requestedMode as AutonomyMode;
    }

    const reviewRecord = await orchestrator.executeReview(caseId, autonomyMode);
    res.status(200).json(reviewRecord);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown orchestrator error';
    if (message.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message,
      });
      return;
    }
    res.status(500).json({
      error: 'Orchestration Error',
      message: `Failed to execute onboarding review workflow: ${message}`,
    });
  }
});

/**
 * GET /api/reviews/:reviewId
 * Retrieves full audit record and execution trace for a previously executed review
 */
reviewRouter.get('/reviews/:reviewId', (req: Request, res: Response) => {
  try {
    const reviewId = Array.isArray(req.params.reviewId)
      ? req.params.reviewId[0]
      : req.params.reviewId;

    const review = orchestrator.getReviewById(reviewId);

    if (!review) {
      res.status(404).json({
        error: 'Not Found',
        message: `Review audit record not found with ID '${reviewId}'`,
      });
      return;
    }

    res.status(200).json(review);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: `Failed to retrieve review audit: ${message}`,
    });
  }
});
