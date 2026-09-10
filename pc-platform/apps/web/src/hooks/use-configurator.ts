import { useQuery } from '@tanstack/react-query';
import { configuratorService } from '../services/configurator.service';

export function useConfiguratorUseCases() {
  return useQuery({
    queryKey: ['configurator', 'use-cases'],
    queryFn: () => configuratorService.getUseCases(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useBaseBuilds(params?: {
  useCase?: string;
  budgetMin?: number;
  budgetMax?: number;
}) {
  return useQuery({
    queryKey: ['configurator', 'base-builds', params],
    queryFn: () => configuratorService.getBaseBuilds(params),
    staleTime: 1000 * 60 * 10,
  });
}

export function useConfiguratorOptions(baseBuildId: string | null) {
  return useQuery({
    queryKey: ['configurator', 'options', baseBuildId],
    queryFn: () => (baseBuildId ? configuratorService.getConfiguratorOptions(baseBuildId) : null),
    enabled: Boolean(baseBuildId),
    staleTime: 1000 * 60 * 10,
  });
}
