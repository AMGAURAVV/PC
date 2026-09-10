import * as React from 'react';
import { cartService, CartItem } from '../services/cart.service';
import type { Product } from '@pc-platform/types';

export function useCart() {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    setItems(cartService.getItems());
    setIsLoaded(true);
  }, []);

  const addItem = React.useCallback((product: Product, quantity = 1) => {
    const updated = cartService.addItem(product, quantity);
    setItems([...updated]);
  }, []);

  const removeItem = React.useCallback((productId: string) => {
    const updated = cartService.removeItem(productId);
    setItems([...updated]);
  }, []);

  const updateQuantity = React.useCallback((productId: string, quantity: number) => {
    const updated = cartService.updateQuantity(productId, quantity);
    setItems([...updated]);
  }, []);

  const clearCart = React.useCallback(() => {
    cartService.clearCart();
    setItems([]);
  }, []);

  const total = React.useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        subtotal: acc.subtotal + item.product.price * item.quantity,
        itemCount: acc.itemCount + item.quantity,
      }),
      { subtotal: 0, itemCount: 0 }
    );
  }, [items]);

  return {
    items,
    isLoaded,
    itemCount: total.itemCount,
    subtotal: total.subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
}
