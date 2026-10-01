import { availableQuantity } from '../types/listing';
import type { Listing } from '../types/listing';

const STORAGE_KEY = 'chasel-curated-cart';
const CART_CHANGED_EVENT = 'chasel:local-cart-changed';

export interface CuratedCartItem {
  cartItemId: number;
  productId: number;
  title: string;
  price: number;
  imageUrls: string[];
  quantity: number;
}

export const getCuratedCart = (): CuratedCartItem[] => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as CuratedCartItem[] : [];
  } catch {
    return [];
  }
};

/**
 * Adds `quantity` units to the local (guest / preview) cart, capped at the
 * seller's stock just like the server cart. Throws with a readable message
 * when the request would exceed it.
 */
export const addCuratedListingToCart = (listing: Listing, quantity = 1) => {
  const items = getCuratedCart();
  const existing = items.find((item) => item.productId === listing.id);
  const inCart = existing?.quantity ?? 0;
  const available = availableQuantity(listing);

  if (inCart + quantity > available) {
    throw new Error(
      `Only ${available} available${inCart > 0 ? ` and ${inCart} already in your cart` : ''}`
    );
  }

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      cartItemId: listing.id,
      productId: listing.id,
      title: listing.title,
      price: listing.price,
      imageUrls: listing.imageUrls ?? [],
      quantity,
    });
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
};

export const removeCuratedListingFromCart = (productId: number) => {
  const items = getCuratedCart().filter((item) => item.productId !== productId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
};

export const clearCuratedCart = () => {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
};

export const localCartChangedEvent = CART_CHANGED_EVENT;
