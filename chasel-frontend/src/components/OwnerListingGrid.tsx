import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductImageCarousel from './ProductImageCarousel';
import { DEFAULT_GRID_COLUMNS } from './editorial/gridColumns';
import { formatListingMeta, formatPrice } from '../types/listing';
import './editorial/ListingGrid.css';
import './editorial/ListingTile.css';
import api from '../api/axios';
import type { OwnerListing } from '../hooks/useMyListings';
import './OwnerListingGrid.css';

const listingCategories = [
  'Clothing',
  'Accessories',
  'Footwear',
  'Watches',
  'Handbags',
  'Jewelry',
  'Beauty',
  'Home',
];

interface OwnerListingGridProps {
  listings: OwnerListing[];
  onUpdated: (listing: OwnerListing) => void;
  onDeleted: (id: number) => void;
}

/** The seller's listing cards with Edit / Delete, plus the dialogs for both. */
function OwnerListingGrid({ listings, onUpdated, onDeleted }: OwnerListingGridProps) {
  const [editingListing, setEditingListing] = useState<OwnerListing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingListing, setDeletingListing] = useState<OwnerListing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const openEditModal = (listing: OwnerListing) => {
    setEditingListing(listing);
    setEditTitle(listing.title);
    setEditCategory(listing.category);
    setEditPrice(listing.price != null ? String(listing.price) : '');
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    setSavingEdit(true);
    setEditError('');

    try {
      // Send the full listing back, overriding only the fields this modal
      // actually edits — otherwise fields this form doesn't expose (brand,
      // size, condition, ...) get silently dropped/nulled on every save.
      const res = await api.put<OwnerListing>(`/listings/${editingListing.id}`, {
        ...editingListing,
        title: editTitle,
        category: editCategory,
        price: editPrice ? parseFloat(editPrice) : null,
      });

      onUpdated(res.data);
      setEditingListing(null);
    } catch {
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
      onDeleted(deletingListing.id);
      setDeletingListing(null);
    } catch {
      // keep the confirm dialog open so the user can retry
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Same grid and tile as Browsing, so a seller sees their pieces the way
          shoppers do — plus Edit / Delete under each one. */}
      <div
        className="ed-listing-grid owner-listing-grid"
        style={{ '--grid-columns': DEFAULT_GRID_COLUMNS } as React.CSSProperties}
      >
        {listings.map((item) => {
          const meta = formatListingMeta({ size: item.size ?? undefined, condition: item.condition });
          return (
            <article
              className="ed-tile"
              key={item.id}
              role="link"
              tabIndex={0}
              aria-label={`${item.brand} ${item.title}`}
              onClick={() => navigate(`/items/${item.id}`)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/items/${item.id}`);
                }
              }}
            >
              <div className="ed-tile-frame">
                <ProductImageCarousel title={item.title} imageUrls={item.imageUrls ?? []} />
                {item.status === 'SOLD' && <span className="ed-tile-sold">Sold</span>}
              </div>

              <div className="ed-tile-body">
                <div className="ed-tile-line">
                  <p className="ed-kicker ed-tile-brand">{item.brand}</p>
                  {item.price != null && <span className="ed-figure">{formatPrice(item.price)}</span>}
                </div>
                <h3 className="ed-tile-title">{item.title}</h3>
                {meta && <p className="ed-meta ed-tile-meta">{meta}</p>}

                <div className="owner-card-actions">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditModal(item);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="owner-card-delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeletingListing(item);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {editingListing && (
        <div className="owner-modal-overlay" onClick={() => setEditingListing(null)}>
          <div className="owner-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit listing</h2>

            <form onSubmit={handleEditSubmit}>
              <div className="owner-field">
                <label htmlFor="edit-listing-title">Title</label>
                <input
                  id="edit-listing-title"
                  type="text"
                  className="owner-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="owner-field">
                <label htmlFor="edit-listing-category">Category</label>
                <select
                  id="edit-listing-category"
                  className="owner-input"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  {listingCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="owner-field">
                <label htmlFor="edit-listing-price">Price</label>
                <input
                  id="edit-listing-price"
                  type="number"
                  className="owner-input"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="0"
                />
              </div>

              {editError && <p className="owner-modal-error">{editError}</p>}

              <div className="owner-modal-actions">
                <button type="button" className="ed-btn ed-btn-outline" onClick={() => setEditingListing(null)}>Cancel</button>
                <button type="submit" className="ed-btn ed-btn-solid" disabled={savingEdit}>
                  {savingEdit ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingListing && (
        <div className="owner-modal-overlay" onClick={() => setDeletingListing(null)}>
          <div className="owner-modal owner-modal-small" onClick={(e) => e.stopPropagation()}>
            <h2>Delete listing?</h2>
            <p className="owner-modal-text">
              Are you sure you want to delete "{deletingListing.title}"? This can't be undone.
            </p>
            <div className="owner-modal-actions">
              <button type="button" className="ed-btn ed-btn-outline" onClick={() => setDeletingListing(null)}>Cancel</button>
              <button type="button" className="ed-btn owner-modal-delete" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OwnerListingGrid;
