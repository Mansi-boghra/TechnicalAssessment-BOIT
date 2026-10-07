import { SyntheticApplicantModel, ReviewCaseModel } from '../models/index.js';
import { SyntheticApplicant, ReviewCase } from '../types/index.js';

/**
 * Onboarding review service layer
 */
export class OnboardingService {
  static getApplicant(id: string): SyntheticApplicant | undefined {
    return SyntheticApplicantModel.findById(id);
  }

  static getAllApplicants(): SyntheticApplicant[] {
    return SyntheticApplicantModel.findAll();
  }

  static getReviewCases(): ReviewCase[] {
    return ReviewCaseModel.findAll();
  }
}
