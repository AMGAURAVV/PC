import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsService, CreateReviewInput } from '../services/reviews.service';

export function useProductReviews(productId: string, page = 1) {
  return useQuery({
    queryKey: ['reviews', productId, page],
    queryFn: () => reviewsService.getProductReviews(productId, page),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewsService.createReview(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}
