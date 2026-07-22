import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './SellItem.css';

interface FormErrors {
  [key: string]: string;
}

function SellItem() {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Form fields
  const [brand, setBrand] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [condition, setCondition] = useState('');
  const [originalRetail, setOriginalRetail] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!brand.trim()) newErrors.brand = 'Brand is required';
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!category.trim()) newErrors.category = 'Category is required';
    if (!condition) newErrors.condition = 'Condition is required';
    if (!price.trim()) newErrors.price = 'Price is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const newImages = Array.from(files);
    if (images.length + newImages.length > 4) {
      setErrors({ ...errors, images: 'Maximum 4 images allowed' });
      return;
    }

    setImages([...images, ...newImages]);

    // Create previews
    newImages.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreviews((prev) => [...prev, event.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    setErrors({ ...errors, images: '' });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setSuccess('');

    try {
      const payload = {
        brand,
        title,
        description,
        category,
        size: size || null,
        condition,
        originalRetail: originalRetail ? parseFloat(originalRetail) : null,
        price: parseFloat(price),
        imageUrls: [],
      };

      console.log('Submitting listing with payload:', payload);

      const response = await api.post('/listings', payload);
      console.log('Listing created successfully:', response.data);

      setSuccess('Listing created! Redirecting...');
      setTimeout(() => navigate('/home'), 1500);
    } catch (err) {
      console.error('Error creating listing:', err);

      const errorMessage = err instanceof Error ? err.message : 'Failed to create listing. Please try again.';
      setErrors({ ...errors, submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-page">
      <div className="sell-container">
        {/* Step Indicator */}
        <div className="step-indicator">
          <span className="step-number">STEP 01</span>
          <span className="step-separator">·</span>
          <span className="step-title">THE PIECE</span>
        </div>

        {/* Page Title */}
        <div className="sell-header-main">
          <h1>List an item</h1>
          <p>Tell us about the piece. Our specialists review every listing within 48 hours before it goes live in the archive.</p>
        </div>

        <form onSubmit={handleSubmit} className="sell-form">
          <div className="form-columns">
            {/* Left Column - Photography */}
            <div className="form-column form-column-left">
              <h3 className="section-label">PHOTOGRAPHY</h3>

              <div className="image-upload-area">
                {imagePreviews.length === 0 ? (
                  <label htmlFor="image-input" className="image-upload-placeholder">
                    <div className="upload-icon">+</div>
                    <p>Add primary image</p>
                    <span className="upload-hint">JPG / PNG · UP TO 15 MB</span>
                  </label>
                ) : (
                  <div className="primary-image">
                    <img src={imagePreviews[0]} alt="Primary" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(0)}
                    >
                      ×
                    </button>
                  </div>
                )}
                <input
                  id="image-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden-input"
                />
              </div>

              {/* Additional Images */}
              {imagePreviews.length > 0 && (
                <div className="additional-images">
                  {imagePreviews.slice(1).map((preview, idx) => (
                    <div key={idx + 1} className="thumbnail">
                      <img src={preview} alt={`Image ${idx + 2}`} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(idx + 1)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 4 && (
                    <label htmlFor="image-input-additional" className="add-thumbnail">
                      <span>+ {4 - imagePreviews.length}</span>
                    </label>
                  )}
                </div>
              )}

              <p className="image-guidance">
                Include tags, labels, and any imperfections. Natural light, neutral backdrop. Well-photographed listings sell 3x faster.
              </p>

              {errors.images && <p className="form-error">{errors.images}</p>}
            </div>

            {/* Right Column - Piece Details */}
            <div className="form-column form-column-right">
              <h3 className="section-label">PIECE DETAILS</h3>

              {/* Brand */}
              <div className="form-group">
                <label className="form-label">BRAND</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. The Row"
                  className={`form-input ${errors.brand ? 'error' : ''}`}
                />
                {errors.brand && <p className="field-error">{errors.brand}</p>}
              </div>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">TITLE</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Heavy Wool Trouser"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                />
                {errors.title && <p className="field-error">{errors.title}</p>}
              </div>

              {/* Category & Size */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`form-input ${errors.category ? 'error' : ''}`}
                  >
                    <option value="">Select...</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Watches">Watches</option>
                    <option value="Handbags">Handbags</option>
                    <option value="Jewelry">Jewelry</option>
                  </select>
                  {errors.category && <p className="field-error">{errors.category}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">SIZE</label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. M / 32 / 42"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Condition & Original Retail */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">CONDITION</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className={`form-input ${errors.condition ? 'error' : ''}`}
                  >
                    <option value="">Select...</option>
                    <option value="Like New">Like New</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                  {errors.condition && <p className="field-error">{errors.condition}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">ORIGINAL RETAIL</label>
                  <div className="input-prefix">
                    <span>$</span>
                    <input
                      type="number"
                      value={originalRetail}
                      onChange={(e) => setOriginalRetail(e.target.value)}
                      placeholder="0"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">DESCRIPTION</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="History, fit, imperfections, provenance..."
                  rows={4}
                  className="form-input"
                />
              </div>

              {/* Price */}
              <div className="form-group">
                <label className="form-label">ASKING PRICE</label>
                <div className="input-prefix">
                  <span>$</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className={`form-input ${errors.price ? 'error' : ''}`}
                  />
                </div>
                {errors.price && <p className="field-error">{errors.price}</p>}
              </div>

              {/* Messages */}
              {errors.submit && <p className="form-error">{errors.submit}</p>}
              {success && <p className="form-success">{success}</p>}

              {/* Submit Buttons */}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-submit"
                >
                  {loading ? 'SUBMITTING...' : 'SUBMIT FOR REVIEW'}
                </button>
                <button type="button" className="btn-draft">
                  SAVE DRAFT
                </button>
              </div>

              <p className="review-notice">
                Reviewed within 48 hours. You'll be notified before it goes live.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SellItem;
