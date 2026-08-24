import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { SearchContext } from './SearchContext';
import type { SearchItem } from './SearchContext';

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);

  const value = useMemo(
    () => ({ searchQuery, setSearchQuery, searchItems, setSearchItems }),
    [searchQuery, searchItems]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
