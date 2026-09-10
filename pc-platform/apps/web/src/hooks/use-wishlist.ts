import * as React from 'react';
import { wishlistService, WishlistItem } from '../services/wishlist.service';
import type { Product } from '@pc-platform/types';

export function useWishlist() {
  const [items, setItems] = React.useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const refreshWishlist = React.useCallback(async () => {
    const list = await wishlistService.getWishlist();
    setItems(list);
    setIsLoaded(true);
  }, []);

  React.useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const toggleWishlist = React.useCallback(
    async (product: Product) => {
      const isPresent = items.some((i) => i.productId === product.id);
      if (isPresent) {
        const updated = await wishlistService.removeItem(product.id);
        setItems([...updated]);
      } else {
        const updated = await wishlistService.addItem(product);
        setItems([...updated]);
      }
    },
    [items]
  );

  const isInWishlist = React.useCallback(
    (productId: string) => {
      return items.some((i) => i.productId === productId);
    },
    [items]
  );

  return {
    items,
    itemCount: items.length,
    isLoaded,
    toggleWishlist,
    isInWishlist,
    refreshWishlist,
  };
}
