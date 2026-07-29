import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import './ProductDetail.css';

interface Listing {
  id: number;
  title: string;
  brand: string;
  description?: string;
  category: string;
  size?: string;
  condition: string;
  originalRetail?: number;
  price: number;
  imageUrls?: string[];
  location?: string;
}

const categories = [
  'Clothing',
  'Accessories',
  'Footwear',
  'Watches',
  'Handbags',
];

const createFormFromListing = (product: Listing) => ({
  title: product.title,
  brand: product.brand,
  description: product.description ?? '',
  category: product.category,
  size: product.size ?? '',
  condition: product.condition,
  originalRetail: product.originalRetail?.toString() ?? '',
  price: product.price.toString(),
  location: product.location ?? '',
  imageUrls: [...(product.imageUrls ?? [])],
});

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [form, setForm] = useState({
    title: '',
    brand: '',
    description: '',
    category: '',
    size: '',
    condition: '',
    originalRetail: '',
    price: '',
    location: '',
    imageUrls: [] as string[],
  });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const [listingResponse, mineResponse] = await Promise.all([
          api.get<Listing>(`/listings/${id}`),
          api.get<Listing[]>('/listings/mine'),
        ]);

        const product = listingResponse.data;
        setListing(product);
        setIsOwner(
          mineResponse.data.some((mine) => mine.id === product.id)
        );
        setForm(createFormFromListing(product));
      } catch (error) {
        console.error('Failed to load product:', error);
      }
    };

    loadProduct();
  }, [id]);

  const updateField = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const chooseImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const available = 4 - form.imageUrls.length - newImages.length;

    if (files.length > available) {
      alert('A product can have up to 4 images.');
      return;
    }

    setNewImages((current) => [...current, ...files]);
    event.target.value = '';
  };

  const saveChanges = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      let uploadedUrls: string[] = [];

      if (newImages.length > 0) {
        const uploadData = new FormData();
        newImages.forEach((image) => uploadData.append('files', image));
        const uploadResponse = await api.post<string[]>(
          '/uploads',
          uploadData
        );
        uploadedUrls = uploadResponse.data;
      }

      const payload = {
        title: form.title,
        brand: form.brand,
        description: form.description,
        category: form.category,
        size: form.size || null,
        condition: form.condition,
        originalRetail: form.originalRetail
          ? Number(form.originalRetail)
          : null,
        price: Number(form.price),
        location: form.location || null,
        imageUrls: [...form.imageUrls, ...uploadedUrls],
      };

      const response = await api.put<Listing>(
        `/listings/${id}`,
        payload
      );

      setListing(response.data);
      setForm(createFormFromListing(response.data));
      setNewImages([]);
      setSelectedImage(0);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Could not update this product.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    const confirmed = window.confirm(
      'Delete this product permanently? This cannot be undone.'
    );

    if (!confirmed) return;

    try {
      await api.delete(`/listings/${id}`);
      navigate('/home');
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Could not delete this product.');
    }
  };

  if (!listing) {
    return <main className="product-loading">Loading product…</main>;
  }

  const visibleImages = listing.imageUrls ?? [];

  return (
    <main className="product-detail-page">
      <button
        type="button"
        className="product-back"
        onClick={() => navigate('/home')}
      >
        ← Back to browse
      </button>

      {!editing ? (
        <section className="product-detail-layout">
          <div className="product-gallery">
            <div className="product-main-image">
              {visibleImages[selectedImage] ? (
                <img
                  src={visibleImages[selectedImage]}
                  alt={listing.title}
                />
              ) : (
                <span>No image</span>
              )}
            </div>

            {visibleImages.length > 1 && (
              <div className="product-thumbnails">
                {visibleImages.map((imageUrl, index) => (
                  <button
                    type="button"
                    className={selectedImage === index ? 'active' : ''}
                    key={imageUrl}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={imageUrl} alt={`${listing.title} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-copy">
            <span className="product-category">{listing.category}</span>
            <div className="product-title-row">
              <h1>{listing.title}</h1>
              <strong>${listing.price.toFixed(2)}</strong>
            </div>
            <p className="product-brand">{listing.brand}</p>

            <dl className="product-facts">
              <div>
                <dt>Condition</dt>
                <dd>{listing.condition}</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>{listing.size || 'Not specified'}</dd>
              </div>
              <div>
                <dt>Original retail</dt>
                <dd>
                  {listing.originalRetail
                    ? `$${listing.originalRetail.toFixed(2)}`
                    : 'Not specified'}
                </dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{listing.location || 'Not specified'}</dd>
              </div>
            </dl>

            <div className="product-description">
              <h2>Description</h2>
              <p>{listing.description || 'No description provided.'}</p>
            </div>

            {isOwner && (
              <div className="owner-actions">
                <button
                  type="button"
                  onClick={() => {
                    setForm(createFormFromListing(listing));
                    setNewImages([]);
                    setSelectedImage(0);
                    setEditing(true);
                  }}
                >
                  Edit product
                </button>
                <button
                  type="button"
                  className="delete-product"
                  onClick={deleteProduct}
                >
                  Delete product
                </button>
              </div>
            )}
          </div>
        </section>
      ) : (
        <form className="product-edit-form" onSubmit={saveChanges}>
          <header>
            <span>OWNER TOOLS</span>
            <h1>Edit product</h1>
          </header>

          <div className="edit-grid">
            <label>
              Title
              <input
                name="title"
                value={form.title}
                onChange={updateField}
                required
              />
            </label>
            <label>
              Brand
              <input
                name="brand"
                value={form.brand}
                onChange={updateField}
                required
              />
            </label>
            <label>
              Category
              <select
                name="category"
                value={form.category}
                onChange={updateField}
                required
              >
                {categories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Size
              <input name="size" value={form.size} onChange={updateField} />
            </label>
            <label>
              Condition
              <input
                name="condition"
                value={form.condition}
                onChange={updateField}
                required
              />
            </label>
            <label>
              Original retail
              <input
                name="originalRetail"
                type="number"
                min="0"
                step="0.01"
                value={form.originalRetail}
                onChange={updateField}
              />
            </label>
            <label>
              Asking price
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={updateField}
                required
              />
            </label>
            <label>
              Location
              <input
                name="location"
                value={form.location}
                onChange={updateField}
              />
            </label>
          </div>

          <label className="edit-description">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              rows={5}
            />
          </label>

          <section className="edit-images">
            <h2>Images</h2>
            <div>
              {form.imageUrls.map((imageUrl) => (
                <figure key={imageUrl}>
                  <img src={imageUrl} alt={form.title} />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        imageUrls: current.imageUrls.filter(
                          (url) => url !== imageUrl
                        ),
                      }))
                    }
                  >
                    ×
                  </button>
                </figure>
              ))}
            </div>

            {form.imageUrls.length + newImages.length < 4 && (
              <label className="edit-upload">
                + Add images ({4 - form.imageUrls.length - newImages.length} left)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={chooseImages}
                />
              </label>
            )}

            {newImages.length > 0 && (
              <p>{newImages.length} new image(s) ready to upload.</p>
            )}
          </section>

          <div className="edit-actions">
            <button
              type="button"
              className="edit-cancel"
              onClick={() => {
                setForm(createFormFromListing(listing));
                setEditing(false);
                setNewImages([]);
                setSelectedImage(0);
              }}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

export default ProductDetail;
