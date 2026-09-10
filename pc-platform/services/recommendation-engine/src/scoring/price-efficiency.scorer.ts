import { CandidateBuild } from '../domain/interfaces';
import { RecommendationInput } from '@pc-platform/types';

export class PriceEfficiencyScorer {
  /**
   * Evaluates value-for-money and budget compliance.
   * Ensures the engine does NOT simply select the most expensive products.
   * Returns a score between 0 and 100.
   */
  public static score(
    build: CandidateBuild,
    performanceScore: number,
    input: RecommendationInput,
  ): number {
    const budget = input.budget;
    const totalCost = build.totalCost;

    if (budget <= 0) return 50;

    const budgetRatio = totalCost / budget;

    // Heavy penalty for exceeding budget
    if (budgetRatio > 1.0) {
      const overPercentage = (budgetRatio - 1.0) * 100;
      // Drastic penalty: -5 points for every 1% over budget
      const penalty = overPercentage * 5;
      return Math.max(0, Math.round(70 - penalty));
    }

    // Budget utilization sweet-spot is between 85% and 98%
    // Performance delivered per rupee ratio normalized
    // If user spent 90% of budget and got 92 performance, value is exceptional!
    const utilizationScore =
      budgetRatio >= 0.85 && budgetRatio <= 0.99
        ? 100
        : budgetRatio < 0.85
        ? Math.max(40, Math.round(budgetRatio * 100))
        : 90; // Exactly 1.0 or right at limit

    // Performance per cost index
    // Higher performance at lower fraction of budget yields higher score
    const perfPerBudgetShare = (performanceScore / (budgetRatio * 100)) * 90;

    const compositeScore = Math.round(perfPerBudgetShare * 0.55 + utilizationScore * 0.45);

    return Math.min(100, Math.max(20, compositeScore));
  }
}
