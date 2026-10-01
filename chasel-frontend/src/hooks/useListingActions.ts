import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSavedItems } from './useSavedItems';
import type { Listing } from '../types/listing';
import { addCuratedListingToCart } from '../utils/curatedCart';

const NO_LISTINGS: ReadonlySet<number> = new Set();

/**
 * Everything a grid of listing tiles can do: open, save, add to cart.
 *
 * `listings` is needed to block sold pieces and to resolve curated
 * (negative-id) pieces, which live in a client-side cart rather than the API's.
 * Guests may add to the cart; members may not buy their own listings.
 */
export function useListingActions(listings: Listing[]) {
  const { isSaved, savingProductId, toggleSaved } = useSavedItems();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  // null while the member's own listings are loading, so no tile offers
  // "Add to cart" on a piece that turns out to be theirs. Guests own nothing.
  const [memberListingIds, setMemberListingIds] = useState<Set<number> | null>(null);
  const ownListingIds = isAuthenticated ? memberListingIds : NO_LISTINGS;

  useEffect(() => {
    // Logout navigates away and unmounts the grid, so there is nothing to reset.
    if (!isAuthenticated) return;

    let active = true;
    api.get<Listing[]>('/listings/mine')
      .then((response) => {
        if (active) setMemberListingIds(new Set(response.data.map((item) => item.id)));
      })
      .catch((error) => {
        console.error('Could not load your listings:', error);
        if (active) setMemberListingIds(new Set());
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const canAddToCart = useCallback(
    (listingId: number) => ownListingIds !== null && !ownListingIds.has(listingId),
    [ownListingIds]
  );

  const openListing = useCallback((id: number) => navigate(`/items/${id}`), [navigate]);

  const addToCart = useCallback(async (productId: number) => {
    const listing = listings.find((item) => item.id === productId);
    if (listing?.status === 'SOLD') {
      alert('This piece has sold and is no longer available.');
      return;
    }

    if (ownListingIds?.has(productId)) {
      alert('You cannot add your own item to the cart.');
      return;
    }

    if (productId < 0) {
      if (!listing) return;

      addCuratedListingToCart(listing);
      alert('Added to cart!');
      return;
    }

    try {
      await addItem(productId);
      alert('Added to cart!');
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Could not add product to cart.');
    }
  }, [listings, ownListingIds, addItem]);

  return { isSaved, savingProductId, toggleSaved, openListing, addToCart, canAddToCart };
}
