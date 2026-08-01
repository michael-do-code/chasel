import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ProductImageCarousel from '../components/ProductImageCarousel';
import BookmarkIcon from '../components/BookmarkIcon';
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

interface SearchSuggestion {
  value: string;
  type: 'Item' | 'Brand' | 'Category' | 'Suggested search';
}

const categories = [
  'All Items',
  'Clothing',
  'Accessories',
  'Footwear',
  'Watches',
  'Handbags',
];

const fashionSearchIdeas = [
  'Blazer outfit',
  'Blazer dress',
  'Black blazer',
  'Brown blazer',
  'Leather jacket',
  'Leather pants',
  'Leather skirt',
  'Leather handbag',
  'Leather boots',
  'Denim jacket',
  'Denim jeans',
  'Denim skirt',
  'Silk dress',
  'Silk blouse',
  'Silk scarf',
  'Cashmere sweater',
  'Cashmere cardigan',
  'Wool coat',
  'Trench coat',
  'Winter coat',
  'Summer dress',
  'Evening dress',
  'Mini dress',
  'Midi dress',
  'Maxi dress',
  'White shirt',
  'Button-down shirt',
  'Wide-leg pants',
  'High-waisted pants',
  'Cargo pants',
  'Tailored trousers',
  'Vintage clothing',
  'Designer handbag',
  'Shoulder bag',
  'Crossbody bag',
  'Tote bag',
  'Brown boots',
  'Ankle boots',
  'Knee-high boots',
  'White sneakers',
  'Running shoes',
  'High heels',
  'Gold watch',
  'Luxury watch',
  'Gold jewelry',
  'Silver jewelry',
  'Pearl necklace',
  'Statement earrings',
  'Minimalist outfit',
  'Business casual',
  'Formal outfit',
  'Streetwear outfit',
  'Vacation outfit',
];

function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

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

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const searchSuggestions = (() => {
    if (!normalizedSearch) return [];

    const candidates: SearchSuggestion[] = [
      ...listings.map((item) => ({
        value: item.title,
        type: 'Item' as const,
      })),
      ...listings.map((item) => ({
        value: item.brand,
        type: 'Brand' as const,
      })),
      ...categories
        .filter((category) => category !== 'All Items')
        .map((category) => ({
          value: category,
          type: 'Category' as const,
        })),
      ...fashionSearchIdeas.map((idea) => ({
        value: idea,
        type: 'Suggested search' as const,
      })),
    ];

    const uniqueSuggestions = candidates.filter(
      (suggestion, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.value.toLowerCase() === suggestion.value.toLowerCase() &&
            candidate.type === suggestion.type
        ) === index &&
        suggestion.value.toLowerCase().includes(normalizedSearch)
    );

    return uniqueSuggestions
      .sort((a, b) => {
        const aStarts = a.value.toLowerCase().startsWith(normalizedSearch);
        const bStarts = b.value.toLowerCase().startsWith(normalizedSearch);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return a.value.localeCompare(b.value);
      })
      .slice(0, 8);
  })();

  const chooseSuggestion = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.value);
    if (suggestion.type === 'Category') {
      setSelectedCategory(suggestion.value);
    }
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };

  const filteredListings = listings.filter((item) => {
    const searchableText = [
      item.title,
      item.brand,
      item.category,
      item.description,
      item.condition,
      item.size,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch || searchableText.includes(normalizedSearch);
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
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setShowSuggestions(true);
              setActiveSuggestion(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setShowSuggestions(false)}
            onKeyDown={(event) => {
              if (!showSuggestions || searchSuggestions.length === 0) return;

              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveSuggestion((current) =>
                  current < searchSuggestions.length - 1 ? current + 1 : 0
                );
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveSuggestion((current) =>
                  current > 0 ? current - 1 : searchSuggestions.length - 1
                );
              } else if (event.key === 'Enter' && activeSuggestion >= 0) {
                event.preventDefault();
                chooseSuggestion(searchSuggestions[activeSuggestion]);
              } else if (event.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            className="search-input"
            role="combobox"
            aria-expanded={showSuggestions && searchSuggestions.length > 0}
            aria-autocomplete="list"
          />

          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="search-suggestions" role="listbox">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={activeSuggestion === index}
                  className={
                    activeSuggestion === index
                      ? 'search-suggestion active'
                      : 'search-suggestion'
                  }
                  key={`${suggestion.type}-${suggestion.value}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseSuggestion(suggestion)}
                  onMouseEnter={() => setActiveSuggestion(index)}
                >
                  <span>{suggestion.value}</span>
                  <small>{suggestion.type}</small>
                </button>
              ))}
            </div>
          )}
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

              <ProductImageCarousel
                title={item.title}
                imageUrls={item.imageUrls}
              />
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
                    <BookmarkIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <p className="search-empty">
            No items match “{searchQuery}”. Try another name, brand, or category.
          </p>
        )}
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
