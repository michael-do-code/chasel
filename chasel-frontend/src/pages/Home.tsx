import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

interface Listing {
  id: number;
  title: string;
  brand: string;
  price: number;
  condition: string;
  size?: string;
  badge: 'FOR SALE' | 'OPEN TO TRADE';
  image: string;
}

const featuredListings: Listing[] = [
  {
    id: 1,
    title: 'Raw Silk Overshirt',
    brand: 'LEMAIRE',
    price: 340,
    condition: 'Excellent',
    badge: 'FOR SALE',
    image: 'linear-gradient(135deg, #D2B499, #956F4C)',
  },
  {
    id: 2,
    title: 'Heavy Wool Trouser',
    brand: 'THE ROW',
    price: 480,
    condition: 'Very good',
    size: '32',
    badge: 'OPEN TO TRADE',
    image: 'linear-gradient(135deg, #AEA397, #D2B499)',
  },
  {
    id: 3,
    title: 'Archive Chelsea Boot 02',
    brand: 'MARGIELA',
    price: 620,
    condition: 'Excellent',
    size: '42',
    badge: 'FOR SALE',
    image: 'linear-gradient(135deg, #956F4C, #4A2B17)',
  },
  {
    id: 4,
    title: 'Cashmere Blend Sweater',
    brand: 'LORO PIANA',
    price: 520,
    condition: 'Like New',
    badge: 'FOR SALE',
    image: 'linear-gradient(135deg, #E6C9AC, #AEA397)',
  },
  {
    id: 5,
    title: 'Leather Crossbody Bag',
    brand: 'CELINE',
    price: 890,
    condition: 'Very good',
    badge: 'OPEN TO TRADE',
    image: 'linear-gradient(135deg, #956F4C, #D2B499)',
  },
  {
    id: 6,
    title: 'Silk Scarves Set',
    brand: 'HERMES',
    price: 380,
    condition: 'Excellent',
    badge: 'FOR SALE',
    image: 'linear-gradient(135deg, #D2B499, #E6C9AC)',
  },
];

const categories = [
  'All Items',
  'Clothing',
  'Accessories',
  'Footwear',
  'Watches',
  'Handbags',
];

function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredListings = featuredListings.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <div className="listing-image" style={{ background: item.image }}>
                <span className={`badge badge-${item.badge === 'FOR SALE' ? 'sale' : 'trade'}`}>
                  {item.badge}
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
