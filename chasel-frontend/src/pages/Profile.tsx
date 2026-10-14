import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ListingGrid from '../components/editorial/ListingGrid';
import PageHeading from '../components/editorial/PageHeading';
import Avatar from '../components/editorial/Avatar';
import type { Listing } from '../types/listing';
import './Profile.css';

interface UserProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
}

/** How many of the newest listings /profile shows before "View all". */
const PROFILE_LISTING_PREVIEW = 4;

// Only the fields the stats need from /orders/my-sales.
interface SaleSummary {
  quantity: number;
  status: string;
  returnStatus: string | null;
}

interface SellerStats {
  itemsSold: number;
}

// Sales that didn't stick: cancelled orders and completed returns.
function countsAsSold(sale: SaleSummary): boolean {
  return sale.status !== 'CANCELLED' && sale.returnStatus !== 'RETURNED' && sale.returnStatus !== 'REFUNDED';
}

function summarizeSales(sales: SaleSummary[]): SellerStats {
  const kept = sales.filter(countsAsSold);
  return {
    itemsSold: kept.reduce((total, sale) => total + sale.quantity, 0),
  };
}

function formatMemberSince(createdAt: string | null): string {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    api.get<UserProfile>('/users/me').then((res) => setProfile(res.data));
    api.get<Listing[]>('/listings/mine')
      .then((res) => setMyListings(
        [...res.data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      ))
      .catch((error) => console.error('Failed to load your listings:', error));
    api.get<SaleSummary[]>('/orders/my-sales')
      .then((res) => setStats(summarizeSales(res.data)))
      .catch((error) => console.error('Failed to load sales for stats:', error));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-shell">
          <p className="profile-status">Loading your profile…</p>
        </div>
      </div>
    );
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email;
  const memberSince = formatMemberSince(profile.createdAt);

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <PageHeading
          kicker="Your account"
          title={fullName}
          leading={<Avatar name={fullName} imageUrl={profile.avatarUrl} size="lg" />}
        >
          <hr className="ed-rule profile-rule" />

          <div className="profile-details-row">
            <dl className="profile-details">
              <div>
                <dt>Email</dt>
                <dd>{profile.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{profile.phone || '—'}</dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>{memberSince || '—'}</dd>
              </div>
              <div>
                <dt>Rating</dt>
                <dd className="profile-detail-muted">No ratings yet</dd>
              </div>
              <div>
                <dt>Items sold</dt>
                <dd>{stats ? stats.itemsSold : '—'}</dd>
              </div>
            </dl>

            <div className="profile-actions">
              <Link to="/profile/edit" className="ed-btn ed-btn-solid">Edit profile</Link>
              <button type="button" className="ed-btn ed-btn-outline" onClick={handleLogout}>Log out</button>
            </div>
          </div>
        </PageHeading>

        <section className="profile-section">
          <header className="profile-section-heading">
            <span className="ed-kicker">01</span>
            <h2>My listings</h2>
            {myListings.length > 0 && (
              <Link to="/my-listings" className="profile-view-all">
                View all ({myListings.length}) <span aria-hidden="true">→</span>
              </Link>
            )}
          </header>

          {myListings.length === 0 ? (
            <div className="profile-empty">
              <p>You haven't listed anything yet.</p>
              <Link to="/sell-item" className="ed-btn ed-btn-outline">List an item</Link>
            </div>
          ) : (
            // Exactly how shoppers see these pieces in Browse; the grid already
            // hides "Add to cart" on the member's own listings.
            <ListingGrid listings={myListings.slice(0, PROFILE_LISTING_PREVIEW)} />
          )}
        </section>

        <section className="profile-section">
          <header className="profile-section-heading">
            <span className="ed-kicker">02</span>
            <h2>Reviews from buyers</h2>
          </header>

          <div className="profile-empty">
            <p>No reviews yet. Reviews from your buyers will show up here.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Profile;
