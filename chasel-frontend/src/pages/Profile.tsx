import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Profile.css';
import './Home.css';

interface UserProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string | null;
}

interface Listing {
  id: number;
  title: string;
  description: string | null;
  category: string;
  price: number | null;
  imageUrls: string[] | null;
  location: string | null;
  createdAt: string;
}

const listingCategories = ['Clothing', 'Accessories', 'Footwear', 'Watches', 'Handbags', 'Jewelry'];

const fallbackListingImages = [
  'linear-gradient(135deg, #D2B499, #956F4C)',
  'linear-gradient(135deg, #AEA397, #D2B499)',
  'linear-gradient(135deg, #956F4C, #4A2B17)',
  'linear-gradient(135deg, #E6C9AC, #AEA397)',
  'linear-gradient(135deg, #956F4C, #D2B499)',
  'linear-gradient(135deg, #D2B499, #E6C9AC)',
];

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
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingListing, setDeletingListing] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('.listing-card') as HTMLElement | null;
    const step = card ? card.getBoundingClientRect().width + 32 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchProfile();
    fetchMyListings();
  }, []);

  const fetchProfile = async () => {
    const res = await api.get<UserProfile>('/users/me');
    setProfile(res.data);
  };

  const fetchMyListings = async () => {
    const res = await api.get<Listing[]>('/listings/mine');
    const sorted = [...res.data].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    setMyListings(sorted);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openEditModal = (listing: Listing) => {
    setEditingListing(listing);
    setEditTitle(listing.title);
    setEditCategory(listing.category);
    setEditPrice(listing.price != null ? String(listing.price) : '');
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingListing(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    setSavingEdit(true);
    setEditError('');

    try {
      const res = await api.put<Listing>(`/listings/${editingListing.id}`, {
        title: editTitle,
        description: editingListing.description,
        category: editCategory,
        price: editPrice ? parseFloat(editPrice) : null,
        imageUrls: editingListing.imageUrls,
        location: editingListing.location,
      });

      setMyListings((prev) => prev.map((l) => (l.id === res.data.id ? res.data : l)));
      setEditingListing(null);
    } catch (err) {
      setEditError('Failed to save changes. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingListing) return;

    setDeleting(true);

    try {
      await api.delete(`/listings/${deletingListing.id}`);
      setMyListings((prev) => prev.filter((l) => l.id !== deletingListing.id));
      setDeletingListing(null);
    } catch (err) {
      // keep the confirm dialog open so the user can retry
    } finally {
      setDeleting(false);
    }
  };

  if (!profile) {
    return null;
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email;

  return (
    <div className="profile-page">
      <section className="dashboard-info-panel">
        <div className="dashboard-avatar">{getInitials(profile)}</div>

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
        <h2 className="section-title">My listings</h2>

        {myListings.length === 0 ? (
          <div className="dashboard-empty">No products yet</div>
        ) : (
          <div className="dashboard-carousel">
            <button
              type="button"
              className="dashboard-carousel-arrow dashboard-carousel-arrow-left"
              onClick={() => scrollByCard(-1)}
              aria-label="Scroll listings left"
            >
              ‹
            </button>

            <div className="dashboard-listings-track" ref={trackRef}>
              {myListings.map((item, index) => (
                <div className="listing-card" key={item.id}>
                  <div
                    className="listing-image"
                    style={{
                      background: item.imageUrls?.[0]
                        ? `url(${item.imageUrls[0]}) center/cover`
                        : fallbackListingImages[index % fallbackListingImages.length],
                    }}
                  >
                    <span className="badge badge-sale">FOR SALE</span>
                  </div>
                  <div className="listing-info">
                    <div className="listing-header">
                      <h3 className="listing-title">{item.title}</h3>
                      {item.price != null && <span className="listing-price">${item.price}</span>}
                    </div>
                    <p className="listing-brand">{item.category}</p>
                    <div className="listing-owner-actions">
                      <button type="button" onClick={() => openEditModal(item)}>Edit</button>
                      <button type="button" className="listing-delete-btn" onClick={() => setDeletingListing(item)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="dashboard-carousel-arrow dashboard-carousel-arrow-right"
              onClick={() => scrollByCard(1)}
              aria-label="Scroll listings right"
            >
              ›
            </button>
          </div>
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

      {editingListing && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Edit listing</h2>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  {listingCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Price</label>
                <input
                  type="number"
                  className="form-input"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="0"
                />
              </div>

              {editError && <p className="profile-error">{editError}</p>}

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={closeEditModal}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={savingEdit}>
                  {savingEdit ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingListing && (
        <div className="modal-overlay" onClick={() => setDeletingListing(null)}>
          <div className="modal-panel modal-panel-small" onClick={(e) => e.stopPropagation()}>
            <h2>Delete listing?</h2>
            <p className="modal-confirm-text">
              Are you sure you want to delete "{deletingListing.title}"? This can't be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-cancel-btn" onClick={() => setDeletingListing(null)}>Cancel</button>
              <button type="button" className="modal-delete-btn" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
