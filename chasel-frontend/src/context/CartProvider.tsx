import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { CartContext } from './CartContext';

/** Response shape of `GET /cart/count`. */
interface CartCount {
  count: number;
}

const fetchCount = () =>
  api.get<CartCount>('/cart/count').then((response) => response.data.count);

/**
 * Keeps the bag's item count in one place so the navbar badge stays in sync
 * with every page that can change the bag — Browsing, SavedItems, and the
 * cart drawer itself.
 *
 * The count is the sum of line quantities, so two of the same piece reads as
 * 2 rather than 1.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const { isAuthenticated } = useAuth();

  // Reload whenever the signed-in member changes.
  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;

    fetchCount()
      .then((next) => {
        if (active) setCount(next);
      })
      .catch((error) => console.error('Could not load the cart count:', error));

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  /** Imperative re-read, used after the bag changes. */
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setCount(await fetchCount());
    } catch (error) {
      console.error('Could not load the cart count:', error);
    }
  }, [isAuthenticated]);

  const addItem = useCallback(
    async (productId: number) => {
      await api.post(`/cart/items/${productId}`);
      await refresh();
    },
    [refresh]
  );

  const removeItem = useCallback(
    async (productId: number) => {
      await api.delete(`/cart/items/${productId}`);
      await refresh();
    },
    [refresh]
  );

  // Guests read zero without the provider having to write state, so signing
  // out clears the badge immediately and the next member starts clean.
  const value = useMemo(
    () => ({ count: isAuthenticated ? count : 0, refresh, addItem, removeItem }),
    [count, isAuthenticated, refresh, addItem, removeItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
