import { useState } from 'react';
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

const fallbackListingImages = [
  'linear-gradient(135deg, #D2B499, #956F4C)',
  'linear-gradient(135deg, #AEA397, #D2B499)',
  'linear-gradient(135deg, #956F4C, #4A2B17)',
  'linear-gradient(135deg, #E6C9AC, #AEA397)',
  'linear-gradient(135deg, #956F4C, #D2B499)',
  'linear-gradient(135deg, #D2B499, #E6C9AC)',
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
      <div className="owner-listing-grid">
        {listings.map((item, index) => (
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

      {editingListing && (
        <div className="modal-overlay" onClick={() => setEditingListing(null)}>
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

              {editError && <p className="modal-error">{editError}</p>}

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setEditingListing(null)}>Cancel</button>
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
    </>
  );
}

export default OwnerListingGrid;
