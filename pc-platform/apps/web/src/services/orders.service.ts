import { API_ENDPOINTS } from '../lib/api/endpoints';
import type { Order, CreateOrderInput, ApiResponse, PaginatedResponse } from '@pc-platform/types';

export const ordersService = {
  async getMyOrders(page = 1, limit = 10): Promise<PaginatedResponse<Order>> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_auth_token') : null;
    const res = await fetch(`${API_ENDPOINTS.ORDERS.MY_ORDERS}?page=${page}&limit=${limit}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch orders: ${res.statusText}`);
    }
    return res.json();
  },

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_auth_token') : null;
    const res = await fetch(API_ENDPOINTS.ORDERS.DETAIL(id), {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch order ${id}`);
    }
    return res.json();
  },

  async createOrder(input: CreateOrderInput): Promise<ApiResponse<Order>> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_auth_token') : null;
    const res = await fetch(API_ENDPOINTS.ORDERS.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Failed to create order');
    }
    return res.json();
  },
};
