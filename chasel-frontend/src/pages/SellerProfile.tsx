import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios';
import PageHeading from '../components/editorial/PageHeading';
import Avatar from '../components/editorial/Avatar';
import ListingGrid from '../components/editorial/ListingGrid';
import type { Listing } from '../types/listing';
import { formatMemberSince } from '../types/seller';
import type { SellerProfile as SellerProfileData } from '../types/seller';
import './SellerProfile.css';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

/**
 * A seller's public storefront at /sellers/:id: who they are and the pieces
 * they currently have for sale. Contact details are never shown here.
 */
function SellerProfile() {
  const { id } = useParams();
  const [seller, setSeller] = useState<SellerProfileData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get<SellerProfileData>(`/users/${id}`),
      api.get<Listing[]>(`/listings/seller/${id}`),
    ])
      .then(([profileResponse, listingsResponse]) => {
        if (!active) return;
        setSeller(profileResponse.data);
        setListings(listingsResponse.data);
        setState('ready');
      })
      .catch((error) => {
        if (!active) return;
        console.error('Could not load seller:', error);
        setState(axios.isAxiosError(error) && error.response?.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (state === 'loading') {
    return <div className="seller-page seller-page-status">Loading seller…</div>;
  }

  if (state !== 'ready' || !seller) {
    return (
      <div className="seller-page seller-page-status">
        <p>{state === 'not-found' ? 'This seller could not be found.' : 'Could not load this seller.'}</p>
        <Link to="/browsing" className="ed-btn ed-btn-outline">Back to browse</Link>
      </div>
    );
  }

  const pieceCount = `${listings.length} ${listings.length === 1 ? 'PIECE' : 'PIECES'}`;
  const details = [
    seller.state,
    seller.memberSince && `Member since ${formatMemberSince(seller.memberSince)}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="seller-page">
      <div className="seller-page-shell">
        <PageHeading
          kicker={`SELLER · ${pieceCount}`}
          title={seller.displayName}
          lede={details || undefined}
          leading={<Avatar name={seller.displayName} imageUrl={seller.avatarUrl} size="lg" />}
        >
          <hr className="ed-rule seller-page-rule" />
        </PageHeading>

        {listings.length === 0 ? (
          <p className="seller-page-empty">Nothing for sale from this seller right now.</p>
        ) : (
          <ListingGrid listings={listings} />
        )}
      </div>
    </div>
  );
}

export default SellerProfile;
