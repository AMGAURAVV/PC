import { API_ENDPOINTS } from '../lib/api/endpoints';
import type { Product, ApiResponse } from '@pc-platform/types';

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: string;
}

const WISHLIST_STORAGE_KEY = 'nexus_guest_wishlist';

export const wishlistService = {
  getGuestWishlist(): WishlistItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  toggleGuestWishlist(product: Product): WishlistItem[] {
    const items = this.getGuestWishlist();
    const index = items.findIndex((i) => i.productId === product.id);

    let updated: WishlistItem[];
    if (index > -1) {
      updated = items.filter((i) => i.productId !== product.id);
    } else {
      updated = [
        ...items,
        {
          id: `guest_${product.id}`,
          productId: product.id,
          product,
          addedAt: new Date().toISOString(),
        },
      ];
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
  },

  async getWishlist(): Promise<WishlistItem[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_auth_token') : null;
    if (!token) {
      return this.getGuestWishlist();
    }

    try {
      const res = await fetch(API_ENDPOINTS.WISHLIST.GET, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch wishlist');
      const data: ApiResponse<WishlistItem[]> = await res.json();
      return data.data || [];
    } catch {
      return this.getGuestWishlist();
    }
  },

  async addItem(product: Product): Promise<WishlistItem[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_auth_token') : null;
    if (!token) {
      return this.toggleGuestWishlist(product);
    }

    try {
      const res = await fetch(API_ENDPOINTS.WISHLIST.ADD_ITEM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!res.ok) throw new Error('Failed to add to wishlist');
      return this.getWishlist();
    } catch {
      return this.toggleGuestWishlist(product);
    }
  },

  async removeItem(productId: string): Promise<WishlistItem[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_auth_token') : null;
    if (!token) {
      const items = this.getGuestWishlist().filter((i) => i.productId !== productId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
      }
      return items;
    }

    try {
      await fetch(API_ENDPOINTS.WISHLIST.REMOVE_ITEM(productId), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return this.getWishlist();
    } catch {
      const items = this.getGuestWishlist().filter((i) => i.productId !== productId);
      return items;
    }
  },
};
