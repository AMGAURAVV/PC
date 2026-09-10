import { useMutation, useQuery } from '@tanstack/react-query';
import { recommendationService } from '../services/recommendation.service';
import type { RecommendationInput } from '@pc-platform/types';

export function useRecommendation(input?: RecommendationInput, enabled: boolean = false) {
  return useQuery({
    queryKey: ['recommendation', input],
    queryFn: () => (input ? recommendationService.getRecommendation(input) : null),
    enabled: Boolean(input && enabled),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useGenerateRecommendation() {
  return useMutation({
    mutationFn: (input: RecommendationInput) =>
      recommendationService.getRecommendation(input),
  });
}
