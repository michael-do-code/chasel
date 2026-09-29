import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';

/** Shape returned by `GET /listings/mine` — the seller's own view of a listing. */
export interface OwnerListing {
  id: number;
  title: string;
  brand: string;
  description: string | null;
  category: string;
  size: string | null;
  condition: string;
  originalRetail: number | null;
  price: number | null;
  imageUrls: string[] | null;
  location: string | null;
  createdAt: string;
}

const newestFirst = (a: OwnerListing, b: OwnerListing) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/**
 * Loads the signed-in member's own listings, newest first.
 *
 * Shared by the /profile preview and the full /my-listings page so both apply
 * edits and deletes the same way.
 */
export function useMyListings() {
  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<OwnerListing[]>('/listings/mine')
      .then((res) => setListings([...res.data].sort(newestFirst)))
      .catch((err) => {
        console.error('Failed to load your listings:', err);
        setError('We could not load your listings. Please refresh and try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const replaceListing = useCallback((updated: OwnerListing) => {
    setListings((current) => current.map((l) => (l.id === updated.id ? updated : l)));
  }, []);

  const removeListing = useCallback((id: number) => {
    setListings((current) => current.filter((l) => l.id !== id));
  }, []);

  return { listings, loading, error, replaceListing, removeListing };
}
