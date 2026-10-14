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
// Shares the account page's layout so a storefront looks like the seller's own profile.
import './Profile.css';
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

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <PageHeading
          kicker="Seller"
          title={seller.displayName}
          leading={<Avatar name={seller.displayName} imageUrl={seller.avatarUrl} size="lg" />}
        >
          <hr className="ed-rule profile-rule" />

          <div className="profile-details-row">
            <dl className="profile-details">
              <div>
                <dt>Location</dt>
                <dd>{seller.state || '—'}</dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>{formatMemberSince(seller.memberSince) || '—'}</dd>
              </div>
              <div>
                <dt>Rating</dt>
                <dd className="profile-detail-muted">No ratings yet</dd>
              </div>
              <div>
                <dt>For sale</dt>
                <dd>{listings.length} {listings.length === 1 ? 'piece' : 'pieces'}</dd>
              </div>
            </dl>
          </div>
        </PageHeading>

        <section className="profile-section">
          <header className="profile-section-heading">
            <span className="ed-kicker">01</span>
            <h2>Listings</h2>
          </header>

          {listings.length === 0 ? (
            <div className="profile-empty">
              <p>Nothing for sale from this seller right now.</p>
            </div>
          ) : (
            <ListingGrid listings={listings} />
          )}
        </section>

        <section className="profile-section">
          <header className="profile-section-heading">
            <span className="ed-kicker">02</span>
            <h2>Reviews from buyers</h2>
          </header>

          <div className="profile-empty">
            <p>No reviews yet.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SellerProfile;
