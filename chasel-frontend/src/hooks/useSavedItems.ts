import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSavedCount } from '../context/SavedItemsContext';
import type { SavedItem } from '../types/listing';

/**
 * Loads the signed-in member's saved items and exposes an optimistic toggle.
 *
 * Both Browsing and Discover previously kept their own copy of this state plus
 * a near-identical toggle handler; keeping it here means the wishlist rules
 * (in-flight guard, rollback on failure) only exist once.
 *
 * Saved items are account-specific, so guests skip the fetch entirely and
 * get redirected to /login if they try to toggle a save.
 */
export function useSavedItems() {
  const [savedProductIds, setSavedProductIds] = useState<number[]>([]);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  const { refresh: refreshSavedCount } = useSavedCount();
  const navigate = useNavigate();

  useEffect(() => {
    // Every logout flow navigates to /login right away, which unmounts
    // whatever was using this hook — so there's no stale state to clear,
    // just nothing left to fetch.
    if (!isAuthenticated) return;

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
  }, [isAuthenticated]);

  const isSaved = useCallback(
    (productId: number) => savedProductIds.includes(productId),
    [savedProductIds]
  );

  const toggleSaved = useCallback(
    async (productId: number) => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

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

        // Keeps the navbar badge in step with the bookmark just toggled.
        await refreshSavedCount();
      } catch (error) {
        console.error('Failed to update saved item:', error);
        alert('Could not update your wishlist.');
      } finally {
        setSavingProductId(null);
      }
    },
    [savedProductIds, isAuthenticated, navigate, refreshSavedCount]
  );

  return { savedProductIds, savingProductId, isSaved, toggleSaved };
}
