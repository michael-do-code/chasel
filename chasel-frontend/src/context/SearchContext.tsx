import { createContext, useContext } from 'react';

export interface SearchItem {
  title: string;
  brand: string;
  category?: string;
  description?: string;
  condition?: string;
  size?: string;
}

export interface SearchContextValue {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchItems: SearchItem[];
  setSearchItems: (items: SearchItem[]) => void;
}

export const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used inside SearchProvider');
  }
  return context;
}
