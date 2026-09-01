import type { Listing } from '../../types/listing';

/**
 * Editorial framing + filtering rules for the `?collection=` views that
 * Discover links into. Keeping the copy next to the predicate means a new
 * collection is one entry here rather than a new branch in the page.
 */

export interface CollectionContext {
  /** How many listings share each (lowercased) brand — used by Rare Finds. */
  brandCounts: Record<string, number>;
  now: number;
}

export interface Heading {
  kicker: string;
  title: string;
  lede: string;
}

export interface CollectionDefinition extends Heading {
  /** Endpoint override; defaults to `/listings`. */
  endpoint?: string;
  matches?: (listing: Listing, context: CollectionContext) => boolean;
  compare?: (a: Listing, b: Listing, context: CollectionContext) => number;
}

export const DEFAULT_HEADING: Heading = {
  kicker: 'THE ARCHIVE',
  title: 'Browse the marketplace',
  lede: 'Every piece listed by a verified member. Sort by newest, curated, or price.',
};

const lower = (value: string) => value.trim().toLowerCase();
const createdAt = (listing: Listing) => new Date(listing.createdAt).getTime();
const newestFirst = (a: Listing, b: Listing) => createdAt(b) - createdAt(a);

const SUSTAINABLE_CATEGORIES = ['Clothing', 'Footwear', 'Handbags', 'Accessories'];
const SUSTAINABLE_CONDITIONS = ['new', 'like new', 'very good', 'good', 'used'];
const RARE_FIND_CONDITIONS = ['new', 'like new', 'very good', 'good'];

const LUXURY_BRANDS = [
  'balenciaga', 'bottega veneta', 'burberry', 'cartier', 'celine', 'chanel',
  'dior', 'dolce & gabbana', 'fendi', 'givenchy', 'gucci', 'hermes', 'hermès',
  'loewe', 'louis vuitton', 'miu miu', 'prada', 'saint laurent', 'tiffany & co.',
  'valentino', 'versace',
];

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const COLLECTIONS: Record<string, CollectionDefinition> = {
  sustainable: {
    kicker: 'THE SUSTAINABLE EDIT',
    title: 'Worn well, worn again',
    lede: 'Pieces chosen for how long they last, not how new they are.',
    matches: (listing) =>
      SUSTAINABLE_CATEGORIES.includes(listing.category) &&
      SUSTAINABLE_CONDITIONS.includes(lower(listing.condition)),
    compare: (a, b) => b.id - a.id,
  },

  'new-this-week': {
    kicker: 'FRESHLY LISTED',
    title: 'New this week',
    lede: 'Everything added to the archive over the last seven days.',
    matches: (listing, { now }) => {
      const listed = createdAt(listing);
      return Number.isFinite(listed) && listed >= now - ONE_WEEK_MS && listed <= now;
    },
    compare: newestFirst,
  },

  'rare-finds': {
    kicker: 'SELDOM SEEN',
    title: 'Rare finds',
    lede: 'The least-represented labels in the archive, in wearable condition.',
    matches: (listing) => RARE_FIND_CONDITIONS.includes(lower(listing.condition)),
    compare: (a, b, { brandCounts }) =>
      (brandCounts[lower(a.brand)] ?? 0) - (brandCounts[lower(b.brand)] ?? 0) ||
      newestFirst(a, b),
  },

  'luxury-brands': {
    kicker: 'THE HOUSES',
    title: 'Luxury brands',
    lede: 'Archive pieces from the houses our members ask for most.',
    matches: (listing) => LUXURY_BRANDS.includes(lower(listing.brand)),
    compare: (a, b) => a.brand.localeCompare(b.brand) || newestFirst(a, b),
  },

  trending: {
    kicker: "WHAT'S RISING",
    title: 'Trending now',
    lede: 'The pieces gaining attention fastest across the marketplace.',
    endpoint: '/listings/trending',
  },
};

export const getCollection = (id: string | null): CollectionDefinition | null =>
  (id && COLLECTIONS[id]) || null;
