import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import BookmarkIcon from '../components/BookmarkIcon';
import ProductImageCarousel from '../components/ProductImageCarousel';
import { useSearch } from '../context/SearchContext';
import promoAtlas from '../assets/promo-atlas.png';
import discoverHero from '../assets/discover-hero.png';
import discoverHeroFrame02 from '../assets/discover-hero-frame-02.png';
import discoverHeroFrame03 from '../assets/discover-hero-frame-03.png';
import discoverHeroFrame04 from '../assets/discover-hero-frame-04.png';
import discoverHeroFrame05 from '../assets/discover-hero-frame-05.png';
import discoverHeroFrame06 from '../assets/discover-hero-frame-06.png';
import discoverHeroFrame07 from '../assets/discover-hero-frame-07.png';
import discoverHeroFrame08 from '../assets/discover-hero-frame-08.png';
import discoverHeroFrame09 from '../assets/discover-hero-frame-09.png';
import discoverHeroFrame10 from '../assets/discover-hero-frame-10.png';
import promoDesigner from '../assets/promo-designer.png';
import promoCategoryClothing from '../assets/promo-category-clothing.png';
import promoCategoryFootwear from '../assets/promo-category-footwear.png';
import promoCategoryAccessories from '../assets/promo-category-accessories.png';
import promoCategoryJewelry from '../assets/promo-category-jewelry.png';
import promoCategoryWatches from '../assets/promo-category-watches.png';
import promoHome from '../assets/promo-home.png';
import promoBeauty from '../assets/promo-beauty.png';
import promoNewWeek from '../assets/promo-new-week.png';
import promoPriceDrops from '../assets/promo-price-drops-model-light.png';
import promoTrendingNow from '../assets/promo-trending-outfit-v2.png';
import promoLuxuryBrands from '../assets/promo-luxury-brands.png';
import './Discover.css';

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

const heroFrames = [
  discoverHeroFrame04,
  discoverHeroFrame08,
  discoverHeroFrame05,
  discoverHeroFrame02,
  discoverHeroFrame03,
  discoverHeroFrame10,
  discoverHeroFrame06,
  discoverHeroFrame07,
  discoverHeroFrame09,
  discoverHero,
];

const categorySlides = [
  { category: 'Handbags', title: 'Designer Spotlight', button: 'Explore handbags', href: '/home?category=Handbags', image: promoDesigner },
  { category: 'Clothing', title: 'Clothing Edit', button: 'Explore clothing', href: '/home?category=Clothing', image: promoCategoryClothing },
  { category: 'Footwear', title: 'Footwear Focus', button: 'Explore footwear', href: '/home?category=Footwear', image: promoCategoryFootwear },
  { category: 'Accessories', title: 'Finishing Touches', button: 'Explore accessories', href: '/home?category=Accessories', image: promoCategoryAccessories },
  { category: 'Jewelry', title: 'Jewelry Selection', button: 'Explore jewelry', href: '/home?category=Jewelry', image: promoCategoryJewelry },
  { category: 'Watches', title: 'Timeless Watches', button: 'Explore watches', href: '/home?category=Watches', image: promoCategoryWatches },
];

const getRandomListings = (items: Listing[], count: number) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled.slice(0, count);
};

const promoStyle = (column: 0 | 1 | 2, row: 0 | 1 | 2) => ({
  backgroundImage: `url(${promoAtlas})`,
  backgroundSize: '300% auto',
  backgroundPosition: `${column * 50}% ${row * 50}%`,
});

const fullPanelStyle = (image: string) => ({
  backgroundImage: `url(${image})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
});

function Discover() {
  const [highlightedListings, setHighlightedListings] = useState<Listing[]>([]);
  const [heroFrameIndex, setHeroFrameIndex] = useState(0);
  const [activeCategorySlide, setActiveCategorySlide] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [savedProductIds, setSavedProductIds] = useState<number[]>([]);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const { setSearchItems } = useSearch();
  const categoryCarouselRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      setHeroFrameIndex((current) => (current + 1) % heroFrames.length);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const carousel = categoryCarouselRef.current;
    if (!carousel) return;

    let hintTimer: number | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;

      setShowSwipeHint(true);
      window.clearTimeout(hintTimer);
      hintTimer = window.setTimeout(() => setShowSwipeHint(false), 5000);
    }, { threshold: 0.45 });

    observer.observe(carousel);
    return () => {
      observer.disconnect();
      window.clearTimeout(hintTimer);
    };
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [listingsResponse, savedResponse] = await Promise.all([
          api.get<Listing[]>('/listings'),
          api.get<SavedItem[]>('/saved-items'),
        ]);
        setHighlightedListings(getRandomListings(listingsResponse.data, 5));
        setSavedProductIds(savedResponse.data.map((item) => item.productId));
        setSearchItems(listingsResponse.data);
      } catch (err) {
        console.error('Error fetching home data:', err);
      }
    };

    fetchHomeData();
  }, [location.key, setSearchItems]);

  const toggleSaved = async (productId: number) => {
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
      alert('Could not update your saved items.');
    } finally {
      setSavingProductId(null);
    }
  };

  const goToCategorySlide = (index: number) => {
    const carousel = categoryCarouselRef.current;
    if (!carousel) return;

    carousel.scrollTo({ left: index * carousel.clientWidth, behavior: 'smooth' });
    setShowSwipeHint(false);
  };

  return (
    <div className="home">
      <main className="marketplace-shell">
        {/* Large campaign panel */}
        <section className="campaign-hero">
          {heroFrames.map((frame, index) => (
            <div
              key={frame}
              className={`campaign-hero-frame ${index === heroFrameIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url(${frame})` }}
              aria-hidden="true"
            />
          ))}
          <div className="campaign-overlay">
            <p className="campaign-kicker">THE SEASONAL EDIT</p>
            <h1>Considered pieces.<br />Loved for longer.</h1>
            <button
              className="campaign-action"
              onClick={() => navigate('/home?category=All%20Items')}
            >
              Shop the collection
            </button>
          </div>
          <span className="sponsored-label">Sponsored</span>
        </section>

        <section className="marketplace-transition" aria-labelledby="marketplace-transition-title">
          <p className="marketplace-transition-kicker">CHOSEN AGAIN</p>
          <h2 id="marketplace-transition-title">Ready for a new chapter.</h2>
          <p>
            Distinctive pieces from individual wardrobes, waiting to become part of yours.
          </p>
        </section>

        {/* Mixed-size advertising panels */}
        <section className="campaign-grid" aria-label="Featured promotions">
          <article className="category-carousel campaign-panel-large" aria-label="Shop featured categories">
            <div
              className="category-carousel-track"
              ref={categoryCarouselRef}
              onScroll={(event) => {
                const track = event.currentTarget;
                const nextIndex = Math.round(track.scrollLeft / track.clientWidth);
                setActiveCategorySlide(nextIndex);
                if (nextIndex > 0) setShowSwipeHint(false);
              }}
            >
              {categorySlides.map((slide) => (
                <section
                  className="campaign-panel category-carousel-slide"
                  key={slide.category}
                  style={fullPanelStyle(slide.image)}
                  aria-label={slide.category}
                >
                  <div className="campaign-copy campaign-copy-light">
                    <p>CURATED FOR YOU</p>
                    <h2>{slide.title}</h2>
                    <button
                      className="category-slide-link"
                      onClick={() => navigate(slide.href)}
                    >
                      {slide.button}
                    </button>
                  </div>
                  <span className="sponsored-label">Sponsored</span>
                </section>
              ))}
            </div>

            <div className={`category-swipe-hint ${showSwipeHint ? 'visible' : ''}`} aria-hidden="true">
              Swipe left to explore <span>→</span>
            </div>

            <button
              type="button"
              className="category-carousel-arrow previous"
              aria-label="Previous category"
              disabled={activeCategorySlide === 0}
              onClick={() => goToCategorySlide(activeCategorySlide - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="category-carousel-arrow next"
              aria-label="Next category"
              disabled={activeCategorySlide === categorySlides.length - 1}
              onClick={() => goToCategorySlide(activeCategorySlide + 1)}
            >
              ›
            </button>

            <div className="category-carousel-dots" aria-label="Choose a category slide">
              {categorySlides.map((slide, index) => (
                <button
                  type="button"
                  key={slide.category}
                  className={index === activeCategorySlide ? 'active' : ''}
                  aria-label={`Show ${slide.category}`}
                  aria-current={index === activeCategorySlide ? 'true' : undefined}
                  onClick={() => goToCategorySlide(index)}
                />
              ))}
            </div>
          </article>

          <article className="campaign-panel campaign-panel-medium campaign-home" style={fullPanelStyle(promoHome)}>
            <div className="campaign-copy">
              <p>NEW CATEGORY</p>
              <h2>Home Refresh</h2>
              <button onClick={() => navigate('/home?category=Home')}>Shop home</button>
            </div>
            <span className="sponsored-label">Sponsored</span>
          </article>

          <article className="campaign-panel campaign-panel-medium campaign-beauty" style={fullPanelStyle(promoBeauty)}>
            <div className="campaign-copy">
              <p>SEALED &amp; SELECTED</p>
              <h2>Beauty Essentials</h2>
              <button onClick={() => navigate('/home?category=Beauty')}>Discover beauty</button>
            </div>
            <span className="sponsored-label">Sponsored</span>
          </article>

        </section>

        <section className="category-campaign-grid" aria-label="Marketplace highlights">
          <article
            className="campaign-panel marketplace-promo marketplace-promo-price"
            style={fullPanelStyle(promoPriceDrops)}
          >
            <div className="campaign-copy">
              <p>JUST REDUCED</p>
              <h2>Price Drops</h2>
              <span>New markdowns across the marketplace</span>
              <div className="price-examples" aria-label="Old prices reduced to new prices">
                <div className="price-change">
                  <del>Old price</del><span aria-hidden="true">→</span><strong>New price</strong>
                </div>
              </div>
              <button onClick={() => navigate('/home')}>See new prices</button>
            </div>
          </article>

          <article
            className="campaign-panel marketplace-promo marketplace-promo-trending"
            style={fullPanelStyle(promoTrendingNow)}
          >
            <div className="campaign-copy">
              <p>COMMUNITY FAVORITES</p>
              <h2>Trending Now</h2>
              <span>The pieces everyone is watching</span>
              <button onClick={() => navigate('/home?collection=trending')}>Explore highlights</button>
            </div>
          </article>

          <article
            className="campaign-panel marketplace-promo marketplace-promo-fresh"
            style={fullPanelStyle(promoLuxuryBrands)}
          >
            <div className="campaign-copy">
              <p>ICONIC DESIGNERS</p>
              <h2>Luxury Brands</h2>
              <span>Gucci, Prada, Dior &amp; more</span>
              <button onClick={() => navigate('/home?collection=luxury-brands')}>Shop luxury</button>
            </div>
          </article>

        </section>

        {/* Listings Section */}
        <section className="listings-section">
          <div className="section-heading-row">
            <h2 className="section-title">From the community</h2>
            <button className="view-all-button" onClick={() => navigate('/home')}>
              View all <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="listings-grid">
            {highlightedListings.map((item) => (
              <div
                className="highlight-listing-card"
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
                <button
                  type="button"
                  className={`highlight-save-button ${savedProductIds.includes(item.id) ? 'saved' : ''}`}
                  aria-label={savedProductIds.includes(item.id) ? 'Remove from saved items' : 'Save item'}
                  aria-pressed={savedProductIds.includes(item.id)}
                  disabled={savingProductId === item.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleSaved(item.id);
                  }}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <BookmarkIcon />
                </button>

                <ProductImageCarousel
                  title={item.title}
                  imageUrls={item.imageUrls}
                />
                <div className="highlight-listing-info">
                  <div className="highlight-listing-header">
                    <div>
                      <p className="highlight-listing-brand">{item.brand}</p>
                      <h3>{item.title}</h3>
                    </div>
                    <span>${item.price}</span>
                  </div>
                  <div className="highlight-listing-details">
                    <span>{item.condition}</span>
                    {item.size && <span>Size {item.size}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="explore-more-heading">
          <h2 className="section-title">Explore more</h2>
        </div>

        {/* Second advertising group keeps campaigns present down the page */}
        <section className="campaign-lower" aria-label="More featured promotions">
          <article className="campaign-panel campaign-panel-wide campaign-new-week" style={fullPanelStyle(promoNewWeek)}>
            <div className="campaign-copy">
              <p>FRESHLY LISTED</p>
              <h2>New This Week</h2>
              <button onClick={() => navigate('/home?collection=new-this-week')}>Browse new arrivals</button>
            </div>
            <span className="sponsored-label">Sponsored</span>
          </article>
          <div className="campaign-lower-grid">
            {[
              ['Rare Finds', promoStyle(1, 1)],
              ['Under $100', promoStyle(2, 1)],
              ["Editor's Picks", promoStyle(2, 2)],
              ['Sustainable Style', promoStyle(0, 0)],
            ].map(([title, style]) => (
              <article
                className="campaign-panel campaign-panel-tile"
                style={style as ReturnType<typeof promoStyle>}
                key={title as string}
                role={title === 'Sustainable Style' || title === 'Rare Finds' ? 'link' : undefined}
                tabIndex={title === 'Sustainable Style' || title === 'Rare Finds' ? 0 : undefined}
                aria-label={title === 'Rare Finds' ? 'Browse rare finds' : undefined}
                onClick={title === 'Sustainable Style'
                  ? () => navigate('/home?collection=sustainable')
                  : title === 'Rare Finds'
                    ? () => navigate('/home?collection=rare-finds')
                    : undefined}
                onKeyDown={title === 'Sustainable Style' || title === 'Rare Finds' ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(title === 'Rare Finds' ? '/home?collection=rare-finds' : '/home?collection=sustainable');
                  }
                } : undefined}
              >
                <div className="campaign-copy campaign-copy-bottom"><h3>{title as string}</h3></div>
                <span className="sponsored-label">Sponsored</span>
              </article>
            ))}
          </div>
        </section>

        <footer className="site-footer" aria-label="Chasel footer">
          <div className="footer-main">
            <div className="footer-brand">
              <p className="footer-wordmark">chasel.</p>
              <h2>Pieces with a past.<br />Style with a future.</h2>
              <p className="footer-brand-copy">
                A considered marketplace for authenticated, pre-loved fashion and objects.
              </p>
            </div>

            <div className="footer-column footer-panel">
              <h3>Help</h3>
              <h4>Here when you need us.</h4>
              <p>Guidance for buying, selling, delivery, and every step in between.</p>
              <div className="footer-link-grid">
                <span>Contact support</span>
                <span>Shipping &amp; returns</span>
                <span>Authentication</span>
                <span>Buying &amp; selling</span>
                <span>Frequently asked questions</span>
                <span>Report a listing</span>
              </div>
            </div>

            <div className="footer-column footer-panel">
              <h3>Policies</h3>
              <h4>Clear, considered standards.</h4>
              <p>How we protect the marketplace, your information, and our community.</p>
              <div className="footer-link-grid">
                <span>Privacy policy</span>
                <span>Terms of use</span>
                <span>Community guidelines</span>
                <span>Cookie policy</span>
                <span>Accessibility</span>
                <span>Marketplace standards</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 chasel. Thoughtfully owned, thoughtfully passed on.</p>
            <div className="footer-trust-points" aria-label="Marketplace commitments">
              <span>Authenticated</span>
              <span>Insured shipping</span>
              <span>Trade or resell</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default Discover;
