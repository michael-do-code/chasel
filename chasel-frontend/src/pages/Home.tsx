import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductImageCarousel from '../components/ProductImageCarousel';
import BookmarkIcon from '../components/BookmarkIcon';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
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
  createdAt: string;
}

interface SavedItem {
  productId: number;
}

const categories = [
  'All Items', 'Clothing', 'Footwear', 'Handbags', 'Accessories',
  'Jewelry', 'Watches', 'Beauty', 'Home',
];

function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<number[]>([]);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const { searchQuery, setSearchItems } = useSearch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedCategory = searchParams.get('category');
  const isSustainableCollection = searchParams.get('collection') === 'sustainable';
  const isNewThisWeekCollection = searchParams.get('collection') === 'new-this-week';
  const isRareFindsCollection = searchParams.get('collection') === 'rare-finds';
  const isLuxuryBrandsCollection = searchParams.get('collection') === 'luxury-brands';
  const isTrendingCollection = searchParams.get('collection') === 'trending';

  useEffect(() => {
    if (requestedCategory && categories.includes(requestedCategory)) {
      setSelectedCategory(requestedCategory);
    }
  }, [requestedCategory]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Guests can browse listings, but saved items are per-account.
        const [listingsResponse, savedResponse] = await Promise.all([
          api.get<Listing[]>(isTrendingCollection ? '/listings/trending' : '/listings'),
          isAuthenticated ? api.get<SavedItem[]>('/saved-items') : Promise.resolve(null),
        ]);
        setListings(listingsResponse.data);
        setSearchItems(listingsResponse.data);
        setSavedProductIds(savedResponse ? savedResponse.data.map((item) => item.productId) : []);
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };
    fetchHomeData();
  }, [isTrendingCollection, setSearchItems, isAuthenticated]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const sustainableCategories = ['Clothing', 'Footwear', 'Handbags', 'Accessories'];
  const sustainableConditions = ['new', 'like new', 'very good', 'good', 'used'];
  const rareFindConditions = ['new', 'like new', 'very good', 'good'];
  const luxuryBrands = [
    'balenciaga', 'bottega veneta', 'burberry', 'cartier', 'celine', 'chanel',
    'dior', 'dolce & gabbana', 'fendi', 'givenchy', 'gucci', 'hermes', 'hermès',
    'loewe', 'louis vuitton', 'miu miu', 'prada', 'saint laurent', 'tiffany & co.',
    'valentino', 'versace',
  ];
  const brandCounts = listings.reduce<Record<string, number>>((counts, item) => {
    const brand = item.brand.trim().toLowerCase();
    counts[brand] = (counts[brand] ?? 0) + 1;
    return counts;
  }, {});
  const now = Date.now();
  const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
  const filteredListings = listings
    .filter((item) => {
      const searchableText = [
        item.title, item.brand, item.category, item.description,
        item.condition, item.size,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesCategory = selectedCategory === 'All Items' || item.category === selectedCategory;
      const matchesSustainableCollection = !isSustainableCollection || (
        sustainableCategories.includes(item.category)
        && sustainableConditions.includes(item.condition.trim().toLowerCase())
      );
      const createdTime = new Date(item.createdAt).getTime();
      const matchesNewThisWeek = !isNewThisWeekCollection || (
        Number.isFinite(createdTime) && createdTime >= oneWeekAgo && createdTime <= now
      );
      const matchesRareFinds = !isRareFindsCollection
        || rareFindConditions.includes(item.condition.trim().toLowerCase());
      const matchesLuxuryBrands = !isLuxuryBrandsCollection
        || luxuryBrands.includes(item.brand.trim().toLowerCase());
      return matchesSearch && matchesCategory && matchesSustainableCollection
        && matchesNewThisWeek && matchesRareFinds && matchesLuxuryBrands;
    })
    .sort((a, b) => {
      if (isNewThisWeekCollection) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (isRareFindsCollection) {
        const brandDifference = brandCounts[a.brand.trim().toLowerCase()]
          - brandCounts[b.brand.trim().toLowerCase()];
        return brandDifference || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (isLuxuryBrandsCollection) {
        return a.brand.localeCompare(b.brand)
          || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return isSustainableCollection ? b.id - a.id : 0;
    });

  const toggleDescription = (productId: number) => {
    setExpandedItems((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
  };

  const addToCart = async (productId: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await api.post(`/cart/items/${productId}`);
      alert('Added to cart!');
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Could not add product to cart.');
    }
  };

  const toggleSaved = async (productId: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const isSaved = savedProductIds.includes(productId);
    setSavingProductId(productId);
    try {
      if (isSaved) {
        await api.delete(`/saved-items/${productId}`);
        setSavedProductIds((current) => current.filter((id) => id !== productId));
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
      <section className="hero">
        <div className="hero-content">
          <h1>Owned once.<br /><span className="highlight">Loved next.</span></h1>
          <p className="hero-subtitle">
            A quiet marketplace for pre-loved and archive luxury. Each piece is listed by its owner, considered, and open to sale or trade.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => navigate('/sell-item')}>LIST AN ITEM</button>
            <button className="btn btn-secondary" onClick={() => setSelectedCategory('All Items')}>BROWSE THE ARCHIVE</button>
          </div>
        </div>
      </section>

      <section className="search-section" aria-label="Shop by category">
        <div className="category-filter">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

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
                if (event.key === 'Enter' || event.key === ' ') navigate(`/items/${item.id}`);
              }}
            >
              <ProductImageCarousel title={item.title} imageUrls={item.imageUrls} />
              <div className="listing-info">
                <div className="listing-header">
                  <h3 className="listing-title">{item.title}</h3>
                  <span className="listing-price">${item.price}</span>
                </div>
                <p className="listing-brand">{item.brand}</p>
                <div className="listing-details">
                  <span className="detail">{item.condition}</span>
                  {item.size && <span className="detail">Size {item.size}</span>}
                </div>
                {item.description && (
                  <div className="listing-description-area">
                    <p className={item.description.length <= 45 || expandedItems.includes(item.id) ? 'listing-description expanded' : 'listing-description'}>
                      {item.description}
                    </p>
                    {item.description.length > 45 && (
                      <button type="button" className="read-more-btn" onClick={(event) => {
                        event.stopPropagation();
                        toggleDescription(item.id);
                      }}>
                        {expandedItems.includes(item.id) ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}
                <div className="listing-actions">
                  <button type="button" className="cart-add-button" onClick={(event) => {
                    event.stopPropagation();
                    addToCart(item.id);
                  }}>Add to Cart</button>
                  <button
                    type="button"
                    className={`wishlist-button ${savedProductIds.includes(item.id) ? 'saved' : ''}`}
                    aria-label={savedProductIds.includes(item.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                    aria-pressed={savedProductIds.includes(item.id)}
                    disabled={savingProductId === item.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleSaved(item.id);
                    }}
                  ><BookmarkIcon /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="philosophy">
        <div className="philosophy-content">
          <h2>The philosophy</h2>
          <p>Every listing on chasel is authenticated by our specialists before it ships. Members can sell outright, or open a piece to trade — pass it forward to someone who'll wear it as intended.</p>
        </div>
        <div className="philosophy-features">
          <div className="feature"><h4>01</h4><p>AUTHENTICATED</p></div>
          <div className="feature"><h4>02</h4><p>INSURED SHIPPING</p></div>
          <div className="feature"><h4>03</h4><p>TRADE OR RESELL</p></div>
        </div>
      </section>
    </div>
  );
}

export default Home;
