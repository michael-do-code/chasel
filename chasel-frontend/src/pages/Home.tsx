import './Home.css';

interface Listing {
  id: number;
  title: string;
  price: number;
  imageColor: string; // placeholder gradient until real images are wired in
}

const sampleListings: Listing[] = [
  { id: 1, title: 'LV Neverfull', price: 800, imageColor: 'linear-gradient(135deg, #3a2e28, #1c1512)' },
  { id: 2, title: 'Rolex Datejust', price: 4200, imageColor: 'linear-gradient(135deg, #4a3a2a, #211a16)' },
  { id: 3, title: 'Chanel Flap', price: 3100, imageColor: 'linear-gradient(135deg, #3a2820, #17110e)' },
  { id: 4, title: 'Hermès Belt', price: 450, imageColor: 'linear-gradient(135deg, #362a22, #1a1310)' },
  { id: 5, title: 'Cartier Love', price: 2600, imageColor: 'linear-gradient(135deg, #40312a, #1e1713)' },
  { id: 6, title: 'Dior Saddle', price: 1900, imageColor: 'linear-gradient(135deg, #33261f, #191310)' },
];

function Home() {
  return (
    <div className="home">
      <div className="home-grid">
        <div className="listing-grid">
          {sampleListings.map((item) => (
            <div className="listing-card" key={item.id} style={{ background: item.imageColor }}>
              <span className="listing-price">${item.price.toLocaleString()}</span>
              <span className="listing-title">{item.title}</span>
            </div>
          ))}
        </div>

        <div className="featured-card">
          <div className="featured-glow" />
          <div className="verified-badge">
            <span className="verified-dot" />
            AI VERIFIED
          </div>
          <div className="featured-body">
            <span className="featured-eyebrow">FEATURED TRADE</span>
            <h3>LV Neverfull</h3>
            <p>Seeking: Dior Saddle Bag, size M</p>
          </div>
        </div>
      </div>

      <div className="hero-text">
        <h1>
          DISCOVER, TRADE,<br />& SELL <span className="accent">EXTRAORDINARY</span><br />LUXURY GOODS
        </h1>

        <div className="hero-actions">
          <button className="btn-secondary">Explore</button>
          <button className="btn-primary">Sell an Item</button>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">12.4K+</span>
            <span className="stat-label">Verified Listings</span>
          </div>
          <div className="stat">
            <span className="stat-number">98.7%</span>
            <span className="stat-label">Authentication Accuracy</span>
          </div>
          <div className="stat">
            <span className="stat-number">3.2K+</span>
            <span className="stat-label">Trades Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;