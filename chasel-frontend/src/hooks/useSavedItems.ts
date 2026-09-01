import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import type { SavedItem } from '../types/listing';

/**
 * Loads the signed-in member's saved items and exposes an optimistic toggle.
 *
 * Both Browsing and Discover previously kept their own copy of this state plus
 * a near-identical toggle handler; keeping it here means the wishlist rules
 * (in-flight guard, rollback on failure) only exist once.
 */
export function useSavedItems() {
  const [savedProductIds, setSavedProductIds] = useState<number[]>([]);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    api
      .get<SavedItem[]>('/saved-items')
      .then((response) => {
        if (active) setSavedProductIds(response.data.map((item) => item.productId));
      })
      .catch((error) => console.error('Could not load saved items:', error));

    return () => {
      active = false;
    };
  }, []);

  const isSaved = useCallback(
    (productId: number) => savedProductIds.includes(productId),
    [savedProductIds]
  );

  const toggleSaved = useCallback(
    async (productId: number) => {
      const wasSaved = savedProductIds.includes(productId);
      setSavingProductId(productId);

      try {
        if (wasSaved) {
          await api.delete(`/saved-items/${productId}`);
          setSavedProductIds((current) => current.filter((id) => id !== productId));
        } else {
          await api.post(`/saved-items/${productId}`);
          setSavedProductIds((current) => [...current, productId]);
        }
      } catch (error) {
        console.error('Failed to update saved item:', error);
        alert('Could not update your wishlist.');
      } finally {
        setSavingProductId(null);
      }
    },
    [savedProductIds]
  );

  return { savedProductIds, savingProductId, isSaved, toggleSaved };
}
