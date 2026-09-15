/** Shape returned by `GET /listings`. Shared by every page that renders items. */
export interface Listing {
  id: number;
  title: string;
  brand: string;
  price: number;
  /** Set when the seller has lowered the price; absent otherwise. */
  previousPrice?: number;
  condition: string;
  size?: string;
  category: string;
  description?: string;
  imageUrls?: string[];
  createdAt: string;
}

/** Shape returned by `GET /saved-items`. */
export interface SavedItem {
  productId: number;
}

export const formatPrice = (price: number) => `$${price.toLocaleString('en-US')}`;

/** "Size 32 · Very good" — the meta line under a listing title. */
export const formatListingMeta = (listing: Pick<Listing, 'size' | 'condition'>) =>
  [listing.size && `Size ${listing.size}`, listing.condition]
    .filter(Boolean)
    .join(' · ');
