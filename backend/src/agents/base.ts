import { AgentResult } from './types.js';

export interface Agent<TInput, TOutput> {
  readonly name: string;
  readonly goal: string;
  readonly responsibility: string;
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Abstract BaseAgent providing standard execution lifecycle,
 * timestamp capture, error boundary, and typed result contracts.
 */
export abstract class BaseAgent<TInput, TOutput extends AgentResult> implements Agent<TInput, TOutput> {
  abstract readonly name: string;
  abstract readonly goal: string;
  abstract readonly responsibility: string;

  public async execute(input: TInput): Promise<TOutput> {
    const startedAt = new Date().toISOString();
    try {
      // NOTE FOR FUTURE LLM ENHANCEMENT:
      // In a production environment with an LLM provider (e.g., Anthropic, OpenAI, Gemini),
      // prompt construction, temperature control, and structured function/tool calling
      // can be invoked here or within the evaluate() method, returning the exact same
      // typed AgentResult contract without requiring changes to downstream orchestrators.
      const result = await this.evaluate(input, startedAt);
      return result;
    } catch (error: unknown) {
      const completedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : 'Unknown execution failure';

      // Fallback failed agent result ensuring resilience
      return this.createFailureResult(message, startedAt, completedAt) as TOutput;
    }
  }

  protected abstract evaluate(input: TInput, startedAt: string): Promise<TOutput>;

  protected abstract createFailureResult(
    reason: string,
    startedAt: string,
    completedAt: string
  ): AgentResult;
}
