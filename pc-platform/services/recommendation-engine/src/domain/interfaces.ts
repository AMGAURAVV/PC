import {
  RecommendationInput,
  RecommendationResult,
  RecommendationScoringBreakdown,
  ComponentRecommendationItem,
  Product,
  CompatibilityResult,
} from '@pc-platform/types';

export interface HardwarePool {
  cpus: Product[];
  motherboards: Product[];
  gpus: Product[];
  ram: Product[];
  storage: Product[];
  psus: Product[];
  cases: Product[];
  cooling: Product[];
}

export interface WorkloadBudgetShares {
  cpu: number;
  gpu: number;
  motherboard: number;
  ram: number;
  storage: number;
  psu: number;
  case: number;
  cooling: number;
}

export interface ScoringWeights {
  performance: number;
  priceEfficiency: number;
  compatibility: number;
  availability: number;
  powerEfficiency: number;
  upgradeability: number;
  userPreferences: number;
}

export interface CandidateBuild {
  cpu: Product;
  motherboard: Product;
  gpu?: Product | undefined;
  ram: Product;
  storage: Product;
  psu: Product;
  case: Product;
  cooling?: Product | undefined;
  totalCost: number;
  compatibilityResult?: CompatibilityResult | undefined;
}

export interface EvaluatedBuild extends CandidateBuild {
  scoringBreakdown: RecommendationScoringBreakdown;
  rationale: string;
}

export interface IRecommendationEngine {
  generateRecommendation(
    input: RecommendationInput,
    candidates: HardwarePool,
  ): Promise<RecommendationResult>;
}
