import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '../services/orders.service';
import type { CreateOrderInput } from '@pc-platform/types';

export function useMyOrders(page = 1) {
  return useQuery({
    queryKey: ['orders', 'my-orders', page],
    queryFn: () => ordersService.getMyOrders(page),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersService.getOrderById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => ordersService.createOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
