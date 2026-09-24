import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { SavedItemsContext } from './SavedItemsContext';

/** Response shape of `GET /saved-items/count`. */
interface SavedCount {
  count: number;
}

const fetchCount = () =>
  api.get<SavedCount>('/saved-items/count').then((response) => response.data.count);

/**
 * Holds the saved-items count for the navbar badge.
 *
 * Only the count lives here — pages that also need to know *which* products
 * are saved keep using `useSavedItems`, which calls `refresh` after a toggle
 * so the badge follows along.
 */
export function SavedItemsProvider({ children }: { children: ReactNode }) {
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
      .catch((error) =>
        console.error('Could not load the saved-items count:', error)
      );

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  /** Imperative re-read, used after a bookmark is toggled. */
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setCount(await fetchCount());
    } catch (error) {
      console.error('Could not load the saved-items count:', error);
    }
  }, [isAuthenticated]);

  // Guests read zero without the provider having to write state, so signing
  // out clears the badge immediately and the next member starts clean.
  const value = useMemo(
    () => ({ count: isAuthenticated ? count : 0, refresh }),
    [count, isAuthenticated, refresh]
  );

  return (
    <SavedItemsContext.Provider value={value}>{children}</SavedItemsContext.Provider>
  );
}
