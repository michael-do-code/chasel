import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSavedItems } from './useSavedItems';
import type { Listing } from '../types/listing';
import { addCuratedListingToCart } from '../utils/curatedCart';

/**
 * Everything a grid of listing tiles can do: open, save, add to cart.
 *
 * `listings` is needed only to resolve curated (negative-id) pieces, which
 * live in a client-side cart rather than the API's.
 */
export function useListingActions(listings: Listing[]) {
  const { isSaved, savingProductId, toggleSaved } = useSavedItems();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const openListing = useCallback((id: number) => navigate(`/items/${id}`), [navigate]);

  const addToCart = useCallback(async (productId: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (productId < 0) {
      const listing = listings.find((item) => item.id === productId);
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
  }, [isAuthenticated, listings, addItem, navigate]);

  return { isSaved, savingProductId, toggleSaved, openListing, addToCart };
}
