import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '../services/categories.service';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getCategories(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
