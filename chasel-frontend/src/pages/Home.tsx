import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Home.css';

interface Listing {
  id: number;
  title: string;
  brand: string;
  price: number;
  condition: string;
  size?: string;
  category: string;
  description?: string;
  imageUrls?: string[];
}

interface SavedItem {
  productId: number;
}

const categories = [
  'All Items',
  'Clothing',
  'Accessories',
  'Footwear',
  'Watches',
  'Handbags',
];

function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedItems, setExpandedItems] =
    useState<number[]>([]);
  const [savedProductIds, setSavedProductIds] =
    useState<number[]>([]);
  const [savingProductId, setSavingProductId] =
    useState<number | null>(null);

  const navigate = useNavigate();

  const toggleDescription = (productId: number) => {
    setExpandedItems((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  };


  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [listingsResponse, savedResponse] = await Promise.all([
          api.get<Listing[]>('/listings'),
          api.get<SavedItem[]>('/saved-items'),
        ]);

        setListings(listingsResponse.data);
        setSavedProductIds(
          savedResponse.data.map((savedItem) => savedItem.productId)
        );
      } catch (err) {
        console.error('Error fetching home data:', err);
      }
    };

    fetchHomeData();
  }, []);

  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All Items' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = async (productId: number) => {
    try {
      await api.post(`/cart/items/${productId}`);
      alert('Added to cart!');
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Could not add product to cart.');
    }
  };

  const toggleSaved = async (productId: number) => {
    const isSaved = savedProductIds.includes(productId);
    setSavingProductId(productId);

    try {
      if (isSaved) {
        await api.delete(`/saved-items/${productId}`);
        setSavedProductIds((current) =>
          current.filter((id) => id !== productId)
        );
      } else {
        await api.post(`/saved-items/${productId}`);
        setSavedProductIds((current) => [...current, productId]);
      }
    } catch (error) {
      console.error('Failed to update saved item:', error);
      alert('Could not update your wishlist.');
    } finally {
      setSavingProductId(null);
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Owned once.
            <br />
            <span className="highlight">Loved next.</span>
          </h1>
          <p className="hero-subtitle">
            A quiet marketplace for pre-loved and archive luxury. Each piece is listed by its owner, considered, and open to sale or trade.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => navigate('/sell-item')}>
              LIST AN ITEM
            </button>
            <button className="btn btn-secondary">BROWSE THE ARCHIVE</button>
          </div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by brand or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filter">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Listings Section */}
      <section className="listings-section">
        <h2 className="section-title">From the community</h2>

        <div className="listings-grid">
          {filteredListings.map((item) => (
            <div
              className="listing-card"
              key={item.id}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/items/${item.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  navigate(`/items/${item.id}`);
                }
              }}
            >

              <div className="listing-image">
                {item.imageUrls?.[0] ? (
                  <img
                    src={item.imageUrls[0]}
                    alt={item.title}
                    className="product-image"
                  />
              ) : (
            <div className="image-placeholder">
            No image
            </div>
          )}

          <span className="badge badge-sale">
            FOR SALE
          </span>
        </div>
              <div className="listing-info">
                <div className="listing-header">
                  <h3 className="listing-title">{item.title}</h3>
                  <span className="listing-price">${item.price}</span>
                </div>
                <p className="listing-brand">{item.brand}</p>

<div className="listing-details">
  <span className="detail">
    {item.condition}
  </span>

  {item.size && (
    <span className="detail">
      Size {item.size}
    </span>
  )}
</div>

{item.description && (
  <div className="listing-description-area">
    <p
      className={
        item.description.length <= 45 ||
        expandedItems.includes(item.id)
          ? 'listing-description expanded'
          : 'listing-description'
      }
    >
      {item.description}
    </p>

    {item.description.length > 45 && (
      <button
        type="button"
        className="read-more-btn"
        onClick={(event) => {
          event.stopPropagation();
          toggleDescription(item.id);
        }}
      >
        {expandedItems.includes(item.id)
          ? 'Show less'
          : 'Read more'}
      </button>
    )}
  </div>
)}

                <div className="listing-actions">
                  <button
                    type="button"
                    className="cart-add-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      addToCart(item.id);
                    }}
                  >
                    Add to Cart
                  </button>

                  <button
                    type="button"
                    className={`wishlist-button ${
                      savedProductIds.includes(item.id) ? 'saved' : ''
                    }`}
                    aria-label={
                      savedProductIds.includes(item.id)
                        ? 'Remove from wishlist'
                        : 'Save to wishlist'
                    }
                    aria-pressed={savedProductIds.includes(item.id)}
                    disabled={savingProductId === item.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleSaved(item.id);
                    }}
                  >
                    {savedProductIds.includes(item.id) ? '♥' : '♡'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="philosophy">
        <div className="philosophy-content">
          <h2>The philosophy</h2>
          <p>
            Every listing on chasel is authenticated by our specialists before it ships. Members can sell outright, or open a piece to trade — pass it forward to someone who'll wear it as intended.
          </p>
        </div>
        <div className="philosophy-features">
          <div className="feature">
            <h4>01</h4>
            <p>AUTHENTICATED</p>
          </div>
          <div className="feature">
            <h4>02</h4>
            <p>INSURED SHIPPING</p>
          </div>
          <div className="feature">
            <h4>03</h4>
            <p>TRADE OR RESELL</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
