import type { Listing } from '../types/listing';

const STORAGE_KEY = 'chasel-curated-cart';

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

export const addCuratedListingToCart = (listing: Listing) => {
  const items = getCuratedCart();
  const existing = items.find((item) => item.productId === listing.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({
      cartItemId: listing.id,
      productId: listing.id,
      title: listing.title,
      price: listing.price,
      imageUrls: listing.imageUrls ?? [],
      quantity: 1,
    });
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const removeCuratedListingFromCart = (productId: number) => {
  const items = getCuratedCart().filter((item) => item.productId !== productId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};
