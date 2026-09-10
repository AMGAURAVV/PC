import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildsService, AddBuildItemInput, SaveBuildInput } from '../services/builds.service';
import type { BuildComponents, CreateBuildInput } from '@pc-platform/types';

export function useBuild(id: string | null) {
  return useQuery({
    queryKey: ['build', id],
    queryFn: () => (id ? buildsService.getBuildById(id) : null),
    enabled: Boolean(id),
  });
}

export function useSharedBuild(shareUrl: string) {
  return useQuery({
    queryKey: ['build', 'shared', shareUrl],
    queryFn: () => buildsService.getSharedBuild(shareUrl),
    enabled: Boolean(shareUrl),
  });
}

export function useBuildEvaluation(items: { productId: string; quantity?: number }[]) {
  return useQuery({
    queryKey: ['build-evaluation', items],
    queryFn: () => buildsService.evaluateBuild({ items }),
    enabled: items.length > 0,
    staleTime: 1000 * 30,
  });
}

export function useBuildMutations(buildId?: string) {
  const queryClient = useQueryClient();

  const invalidateBuild = () => {
    if (buildId) {
      queryClient.invalidateQueries({ queryKey: ['build', buildId] });
    }
    queryClient.invalidateQueries({ queryKey: ['builds'] });
  };

  const createBuildMutation = useMutation({
    mutationFn: (input: CreateBuildInput) => buildsService.createBuild(input),
    onSuccess: invalidateBuild,
  });

  const updateBuildMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateBuildInput> }) =>
      buildsService.updateBuild(id, input),
    onSuccess: invalidateBuild,
  });

  const addItemMutation = useMutation({
    mutationFn: ({ id, item }: { id: string; item: AddBuildItemInput }) =>
      buildsService.addItem(id, item),
    onSuccess: invalidateBuild,
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) =>
      buildsService.removeItem(id, itemId),
    onSuccess: invalidateBuild,
  });

  const saveBuildMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input?: SaveBuildInput }) =>
      buildsService.saveBuild(id, input),
    onSuccess: invalidateBuild,
  });

  const checkCompatibilityMutation = useMutation({
    mutationFn: (components: BuildComponents) =>
      buildsService.checkCompatibility(components),
  });

  return {
    createBuild: createBuildMutation.mutateAsync,
    updateBuild: updateBuildMutation.mutateAsync,
    addItem: addItemMutation.mutateAsync,
    removeItem: removeItemMutation.mutateAsync,
    saveBuild: saveBuildMutation.mutateAsync,
    checkCompatibility: checkCompatibilityMutation.mutateAsync,
    isMutating:
      createBuildMutation.isPending ||
      updateBuildMutation.isPending ||
      addItemMutation.isPending ||
      removeItemMutation.isPending ||
      saveBuildMutation.isPending ||
      checkCompatibilityMutation.isPending,
  };
}
