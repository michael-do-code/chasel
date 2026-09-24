import { createContext, useContext } from 'react';

export interface SavedItemsContextValue {
  /** How many pieces the member has saved. */
  count: number;
  /** Re-reads the count from the API. */
  refresh: () => Promise<void>;
}

export const SavedItemsContext = createContext<SavedItemsContextValue | undefined>(
  undefined
);

export function useSavedCount() {
  const context = useContext(SavedItemsContext);
  if (!context) {
    throw new Error('useSavedCount must be used inside SavedItemsProvider');
  }
  return context;
}
