import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import OwnerListingGrid from '../components/OwnerListingGrid';
import { useMyListings } from '../hooks/useMyListings';
import './Profile.css';
import '../styles/marketplace.css';

interface UserProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
}

/** How many of the newest listings /profile shows before "View all". */
const PROFILE_LISTING_PREVIEW = 3;

const mockRating = { average: 4.2, count: 1284 };

interface Review {
  id: number;
  reviewer: string;
  rating: number;
  comment: string;
  item: string;
  date: string;
}

const mockReviews: Review[] = [
  {
    id: 1,
    reviewer: 'Amelia R.',
    rating: 5,
    comment: 'Exactly as described, shipped fast and packaged with care. Would buy from again.',
    item: 'Raw Silk Overshirt',
    date: 'June 2026',
  },
  {
    id: 2,
    reviewer: 'Marcus T.',
    rating: 4,
    comment: 'Great condition, a little later on shipping but seller kept me updated the whole time.',
    item: 'Archive Chelsea Boot 02',
    date: 'May 2026',
  },
  {
    id: 3,
    reviewer: 'Priya K.',
    rating: 5,
    comment: 'Beautiful piece, even better in person. Very responsive and easy to work with.',
    item: 'Heavy Wool Trouser',
    date: 'April 2026',
  },
];

function getReviewerInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatRatingCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
  return `${count}`;
}

function formatMemberSince(createdAt: string | null): string {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

function getInitials(profile: UserProfile): string {
  const first = profile.firstName?.trim()[0];
  const last = profile.lastName?.trim()[0];
  if (first && last) return (first + last).toUpperCase();
  if (first) return first.toUpperCase();
  return profile.email[0].toUpperCase();
}

function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { listings: myListings, replaceListing, removeListing } = useMyListings();
  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    api.get<UserProfile>('/users/me').then((res) => setProfile(res.data));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!profile) {
    return null;
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email;

  return (
    <div className="profile-page">
      <section className="dashboard-info-panel">
        <div className="dashboard-avatar">
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : getInitials(profile)}
        </div>

        <div className="dashboard-info-main">
          <div className="dashboard-name-row">
            <h2>{fullName}</h2>
            <div className="dashboard-rating">
              <span className="dashboard-rating-star">★</span>
              <span className="dashboard-rating-score">{mockRating.average.toFixed(1)}</span>
              <span className="dashboard-rating-count">({formatRatingCount(mockRating.count)} ratings)</span>
            </div>
          </div>

          <dl className="dashboard-info">
            <div className="dashboard-info-item">
              <dt>Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div className="dashboard-info-item">
              <dt>Phone</dt>
              <dd>{profile.phone || '—'}</dd>
            </div>
            <div className="dashboard-info-item">
              <dt>Member since</dt>
              <dd>{formatMemberSince(profile.createdAt) || '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="dashboard-info-actions">
          <Link to="/profile/edit" className="dashboard-edit-link">Edit Profile</Link>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </section>

      <section className="dashboard-listings-panel listings-section">
        <div className="dashboard-section-header">
          <h2 className="section-title">My listings</h2>
          {myListings.length > 0 && (
            <Link to="/my-listings" className="dashboard-view-all">
              View all ({myListings.length}) <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>

        {myListings.length === 0 ? (
          <div className="dashboard-empty">No products yet</div>
        ) : (
          <OwnerListingGrid
            listings={myListings.slice(0, PROFILE_LISTING_PREVIEW)}
            onUpdated={replaceListing}
            onDeleted={removeListing}
          />
        )}
      </section>

      <section className="dashboard-reviews-panel listings-section">
        <h2 className="section-title">Reviews from buyers</h2>

        <div className="dashboard-reviews-list">
          {mockReviews.map((review) => (
            <div className="dashboard-review-card" key={review.id}>
              <div className="dashboard-review-avatar">{getReviewerInitials(review.reviewer)}</div>
              <div className="dashboard-review-body">
                <div className="dashboard-review-header">
                  <span className="dashboard-review-name">{review.reviewer}</span>
                  <span className="dashboard-review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <p className="dashboard-review-comment">{review.comment}</p>
                <div className="dashboard-review-meta">
                  <span>{review.item}</span>
                  <span>·</span>
                  <span>{review.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default Profile;
