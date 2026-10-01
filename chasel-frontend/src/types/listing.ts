import type { SellerSummary } from './seller';

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
  /** Real marketplace inventory status; preview catalog pieces omit it. */
  status?: 'ACTIVE' | 'SOLD' | 'DRAFT';
  /** Units the seller still has; preview catalog pieces omit it (one each). */
  quantity?: number;
  /** Absent on curated (client-side) listings, which have no real seller. */
  seller?: SellerSummary;
}

/** Shape returned by `GET /saved-items`. */
export interface SavedItem {
  productId: number;
}

/** Units a buyer can still add; listings without stock data are single pieces. */
export const availableQuantity = (listing: Pick<Listing, 'quantity' | 'status'>) =>
  listing.status === 'SOLD' ? 0 : listing.quantity ?? 1;

export const formatPrice =(price: number) => `$${price.toLocaleString('en-US')}`;

/** "Size 32 · Very good" — the meta line under a listing title. */
export const formatListingMeta = (listing: Pick<Listing, 'size' | 'condition'>) =>
  [listing.size && `Size ${listing.size}`, listing.condition]
    .filter(Boolean)
    .join(' · ');
