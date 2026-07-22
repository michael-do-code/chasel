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
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await api.get('/listings');
        setListings(res.data);
      } catch (err) {
        console.error('Error fetching listings:', err);
      }
    };

    fetchListings();
  }, []);

  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All Items' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            <div className="listing-card" key={item.id}>
              <div className="listing-image" style={{ background: `linear-gradient(135deg, #D2B499, #956F4C)` }}>
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
                  <span className="detail">{item.condition}</span>
                  {item.size && <span className="detail">Size {item.size}</span>}
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
