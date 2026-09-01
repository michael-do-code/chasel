import type { Listing } from '../../types/listing';
import type { CollectionContext, CollectionDefinition } from './collections';

export type SortId = 'curated' | 'newest' | 'price-asc' | 'price-desc';

export const SORT_OPTIONS: { value: SortId; label: string }[] = [
  { value: 'curated', label: 'Curated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price ↑' },
  { value: 'price-desc', label: 'Price ↓' },
];

export const ALL_CATEGORIES = 'All Items';

export const CATEGORIES: readonly string[] = [
  ALL_CATEGORIES, 'Clothing', 'Footwear', 'Handbags', 'Accessories',
  'Jewelry', 'Watches', 'Beauty', 'Home',
];

export const CATEGORY_OPTIONS = CATEGORIES.map((value) => ({ value, label: value }));

export interface SelectListingsInput {
  listings: Listing[];
  category: string;
  /** Free text from the navbar search box. */
  search: string;
  /** Upper price bound from `?maxPrice=`, or null for no bound. */
  maxPrice: number | null;
  collection: CollectionDefinition | null;
  sort: SortId;
}

const searchableText = (listing: Listing) =>
  [listing.title, listing.brand, listing.category, listing.description,
    listing.condition, listing.size]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const SORTERS: Record<Exclude<SortId, 'curated'>, (a: Listing, b: Listing) => number> = {
  newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
};

/**
 * Applies category, search, price, and collection filters, then orders the
 * result. `curated` defers to the collection's own ordering (and to the
 * server's order when no collection is active).
 */
export function selectListings({
  listings,
  category,
  search,
  maxPrice,
  collection,
  sort,
}: SelectListingsInput): Listing[] {
  const query = search.trim().toLowerCase();

  const context: CollectionContext = {
    now: Date.now(),
    brandCounts: listings.reduce<Record<string, number>>((counts, listing) => {
      const brand = listing.brand.trim().toLowerCase();
      counts[brand] = (counts[brand] ?? 0) + 1;
      return counts;
    }, {}),
  };

  const visible = listings.filter((listing) =>
    (!query || searchableText(listing).includes(query)) &&
    (category === ALL_CATEGORIES || listing.category === category) &&
    (maxPrice === null || listing.price <= maxPrice) &&
    (!collection?.matches || collection.matches(listing, context))
  );

  if (sort === 'curated') {
    return collection?.compare
      ? [...visible].sort((a, b) => collection.compare!(a, b, context))
      : visible;
  }

  return [...visible].sort(SORTERS[sort]);
}
