import * as React from 'react';
import type { Product } from '@pc-platform/types';

export interface CompareItem {
  id: string;
  name: string;
  slug: string;
  brand?: string | undefined;
  category?: string | undefined;
  price: number;
  compareAtPrice?: number | null | undefined;
  imageUrl?: string | null | undefined;
  inStock?: boolean | undefined;
  specifications?: Record<string, any> | undefined;
}

const COMPARE_STORAGE_KEY = 'nexus_compare_items';

export function useCompare(maxItems = 4) {
  const [items, setItems] = React.useState<CompareItem[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveItems = (updated: CompareItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const toggleCompare = React.useCallback(
    (product: CompareItem | Product) => {
      const exists = items.some((i) => i.id === product.id);
      if (exists) {
        saveItems(items.filter((i) => i.id !== product.id));
      } else {
        if (items.length >= maxItems) {
          // Replace the oldest item or prevent adding
          saveItems([...items.slice(1), product as CompareItem]);
        } else {
          saveItems([...items, product as CompareItem]);
        }
      }
    },
    [items, maxItems]
  );

  const removeItem = React.useCallback(
    (id: string) => {
      saveItems(items.filter((i) => i.id !== id));
    },
    [items]
  );

  const clearAll = React.useCallback(() => {
    saveItems([]);
  }, []);

  const isComparing = React.useCallback(
    (id: string) => {
      return items.some((i) => i.id === id);
    },
    [items]
  );

  return {
    items,
    itemCount: items.length,
    isModalOpen,
    setIsModalOpen,
    toggleCompare,
    removeItem,
    clearAll,
    isComparing,
  };
}
