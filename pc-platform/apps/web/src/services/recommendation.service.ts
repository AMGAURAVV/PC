import { getRecommendation } from '../lib/api/client';
import type {
  RecommendationInput,
  RecommendationResult,
  ApiResponse,
} from '@pc-platform/types';

export const recommendationService = {
  async getRecommendation(
    input: RecommendationInput,
  ): Promise<ApiResponse<RecommendationResult>> {
    return getRecommendation(input);
  },
};
