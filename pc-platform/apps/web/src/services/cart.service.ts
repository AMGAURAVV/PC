import type { Product } from '@pc-platform/types';

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: string;
}

const CART_STORAGE_KEY = 'nexus_cart_items';

export const cartService = {
  getItems(): CartItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addItem(product: Product, quantity = 1): CartItem[] {
    const items = this.getItems();
    const existingIndex = items.findIndex((i) => i.product.id === product.id);

    const existingItem = existingIndex > -1 ? items[existingIndex] : undefined;

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      items.push({
        product,
        quantity,
        addedAt: new Date().toISOString(),
      });
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
    return items;
  },

  removeItem(productId: string): CartItem[] {
    const items = this.getItems().filter((i) => i.product.id !== productId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
    return items;
  },

  updateQuantity(productId: string, quantity: number): CartItem[] {
    const items = this.getItems();
    const target = items.find((i) => i.product.id === productId);
    if (target) {
      if (quantity <= 0) {
        return this.removeItem(productId);
      }
      target.quantity = quantity;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
    return items;
  },

  clearCart(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  },

  getTotal(): { subtotal: number; itemCount: number } {
    const items = this.getItems();
    return items.reduce(
      (acc, item) => ({
        subtotal: acc.subtotal + item.product.price * item.quantity,
        itemCount: acc.itemCount + item.quantity,
      }),
      { subtotal: 0, itemCount: 0 }
    );
  },
};
