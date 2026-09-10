import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  communityService,
  QueryCommunityBuildsParams,
  CommunityBuild,
} from '../services/community.service';

export function useCommunityBuilds(
  params?: QueryCommunityBuildsParams,
  options?: { initialData?: any },
) {
  return useQuery({
    queryKey: ['community-builds', params],
    queryFn: () => communityService.getBuilds(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
    initialData: options?.initialData,
  });
}

export function useCommunityFilters() {
  return useQuery({
    queryKey: ['community-filters'],
    queryFn: () => communityService.getFilters(),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCommunityBuild(slug: string, options?: { initialData?: any }) {
  return useQuery({
    queryKey: ['community-build', slug],
    queryFn: () => communityService.getBuildBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    initialData: options?.initialData,
  });
}

export function useCommunityComments(buildId: string) {
  return useQuery({
    queryKey: ['community-comments', buildId],
    queryFn: () => communityService.getComments(buildId),
    enabled: Boolean(buildId),
  });
}

export function useToggleBuildLike(buildId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => communityService.toggleLike(buildId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-build'] });
      queryClient.invalidateQueries({ queryKey: ['community-builds'] });
    },
  });
}

export function useAddCommunityComment(buildId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => communityService.addComment(buildId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-comments', buildId] });
      queryClient.invalidateQueries({ queryKey: ['community-build'] });
    },
  });
}

export function useReportCommunityBuild(buildId: string) {
  return useMutation({
    mutationFn: ({ reason, details }: { reason: string; details?: string }) =>
      communityService.reportBuild(buildId, reason, details),
  });
}
