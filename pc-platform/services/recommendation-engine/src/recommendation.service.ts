import { Injectable, Logger } from '@nestjs/common';
import { RecommendationInput, RecommendationResult } from '@pc-platform/types';
import { HardwarePool, IRecommendationEngine } from './domain/interfaces';
import { RuleBasedRecommendationEngine } from './engine/rule-based-recommendation.engine';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private engine: IRecommendationEngine;

  constructor() {
    // Default to deterministic rule-based engine (zero LLM dependency)
    this.engine = new RuleBasedRecommendationEngine();
  }

  /**
   * Pluggable engine setter: allows swapping with an AI-augmented engine later
   * without rewriting builder or recommendation workflows.
   */
  public setEngine(engine: IRecommendationEngine): void {
    this.engine = engine;
  }

  public async getRecommendation(
    input: RecommendationInput,
    candidates: HardwarePool,
  ): Promise<RecommendationResult> {
    this.logger.log(
      `Generating recommendation for useCase="${input.useCase}" budget=₹${input.budget}`,
    );
    return this.engine.generateRecommendation(input, candidates);
  }
}
