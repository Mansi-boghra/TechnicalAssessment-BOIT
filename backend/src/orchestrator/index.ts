/**
 * Multi-Agent Orchestrator
 * Coordinates review workflows across agents.
 * Workflow execution logic to follow in subsequent steps.
 */

export interface OrchestratorConfig {
  sequential: boolean;
  stopOnFailure: boolean;
}

export class CaseReviewOrchestrator {
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig = { sequential: true, stopOnFailure: false }) {
    this.config = config;
  }

  public getConfig(): OrchestratorConfig {
    return this.config;
  }
}
