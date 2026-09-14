import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import BookmarkIcon from '../components/BookmarkIcon';
import ProductImageCarousel from '../components/ProductImageCarousel';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import discoverHeroFrame04 from '../assets/discover-hero-frame-04.png';
import promoDesigner from '../assets/promo-category-handbags-wide.png';
import promoCategoryClothing from '../assets/promo-category-clothing-wide.png';
import promoCategoryFootwear from '../assets/promo-category-footwear-wide.png';
import promoCategoryAccessories from '../assets/promo-category-accessories-wide.png';
import promoCategoryJewelry from '../assets/promo-category-jewelry-wide.png';
import promoCategoryWatches from '../assets/promo-category-watches-wide.png';
import promoHome from '../assets/promo-home.png';
import promoBeauty from '../assets/promo-beauty.png';
import promoPriceDrops from '../assets/promo-price-drops-symbols.png';
import promoTrendingNow from '../assets/promo-trending-model-green-purse.png';
import promoUnder100 from '../assets/promo-under-100-price-line.png';
import promoNewWeek from '../assets/promo-new-week-refined.png';
import promoMostSaved from '../assets/promo-most-saved-refined.png';
import promoAuthenticated from '../assets/promo-authenticated-refined.png';
import promoCompleteLook from '../assets/promo-complete-look-refined.png';
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

const categorySlides = [
  { category: 'Seasonal Edit', kicker: 'THE SEASONAL EDIT', title: 'Considered pieces. Loved for longer.', slogan: 'Chosen with care, worn with purpose, and loved through every chapter.', sloganStyle: 'editorial', button: 'Shop the collection', href: '/home?category=All%20Items', image: discoverHeroFrame04, position: 'center top' },
  { category: 'Home', kicker: 'NEW CATEGORY', title: 'Home Refresh', slogan: 'A beautiful life begins in the rooms that hold your quietest, happiest moments.', sloganStyle: 'graceful', button: 'Shop home', href: '/home?category=Home', image: promoHome },
  { category: 'Handbags', kicker: 'ICONIC CARRYALLS', title: 'Designer Spotlight', slogan: 'Carry what matters, and let every thoughtful detail speak before you do.', sloganStyle: 'signature', button: 'Explore handbags', href: '/home?category=Handbags', image: promoDesigner },
  { category: 'Clothing', kicker: 'EVERYDAY EXPRESSION', title: 'Clothing Edit', slogan: 'Dress for the life you live, with pieces that feel effortless and entirely your own.', sloganStyle: 'modern', button: 'Explore clothing', href: '/home?category=Clothing', image: promoCategoryClothing },
  { category: 'Footwear', kicker: 'STEP INTO STYLE', title: 'Footwear Focus', slogan: 'Move with purpose, step with confidence, and arrive in unmistakable style.', sloganStyle: 'dynamic', button: 'Explore footwear', href: '/home?category=Footwear', image: promoCategoryFootwear },
  { category: 'Accessories', kicker: 'DETAILS THAT DEFINE', title: 'Finishing Touches', slogan: 'The smallest details have a beautiful way of leaving the strongest impression.', sloganStyle: 'flourish', button: 'Explore accessories', href: '/home?category=Accessories', image: promoCategoryAccessories },
  { category: 'Beauty', kicker: 'SEALED & SELECTED', title: 'Beauty Essentials', slogan: 'Honor the quiet rituals that reveal your natural light and lasting confidence.', sloganStyle: 'soft', button: 'Discover beauty', href: '/home?category=Beauty', image: promoBeauty },
  { category: 'Jewelry', kicker: 'LIGHT TO TREASURE', title: 'Jewelry Selection', slogan: 'Wear a little light close to you, made to shimmer through every chapter.', sloganStyle: 'luminous', button: 'Explore jewelry', href: '/home?category=Jewelry', image: promoCategoryJewelry },
  { category: 'Watches', kicker: 'TIMELESS CRAFT', title: 'Timeless Watches', slogan: 'Time moves forward, while true craftsmanship and personal style remain.', sloganStyle: 'precision', button: 'Explore watches', href: '/home?category=Watches', image: promoCategoryWatches },
];

const carouselSlides = [...categorySlides, categorySlides[0]];

const getRandomListings = (items: Listing[], count: number) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled.slice(0, count);
};

const fullPanelStyle = (image: string, position = 'center') => ({
  backgroundImage: `url(${image})`,
  backgroundPosition: position,
  backgroundSize: 'cover',
});

function Discover() {
  const [highlightedListings, setHighlightedListings] = useState<Listing[]>([]);
  const [activeCategorySlide, setActiveCategorySlide] = useState(0);
  const [isCategoryCarouselPaused, setIsCategoryCarouselPaused] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [savedProductIds, setSavedProductIds] = useState<number[]>([]);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const { setSearchItems } = useSearch();
  const categoryCarouselRef = useRef<HTMLDivElement>(null);
  const categoryScrollEndTimerRef = useRef<number | undefined>(undefined);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
    if (isCategoryCarouselPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      setActiveCategorySlide((current) => {
        const nextIndex = current + 1;
        const carousel = categoryCarouselRef.current;
        carousel?.scrollTo({ left: nextIndex * carousel.clientWidth, behavior: 'smooth' });

        if (nextIndex === categorySlides.length) {
          return 0;
        }

        return nextIndex;
      });
    }, 2500);

    return () => window.clearInterval(timer);
  }, [isCategoryCarouselPaused]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Guests can browse listings, but saved items are per-account.
        const [listingsResponse, savedResponse] = await Promise.all([
          api.get<Listing[]>('/listings'),
          isAuthenticated ? api.get<SavedItem[]>('/saved-items') : Promise.resolve(null),
        ]);
        setHighlightedListings(getRandomListings(listingsResponse.data, 5));
        setSavedProductIds(savedResponse ? savedResponse.data.map((item) => item.productId) : []);
        setSearchItems(listingsResponse.data);
      } catch (err) {
        console.error('Error fetching home data:', err);
      }
    };

    fetchHomeData();
  }, [location.key, setSearchItems, isAuthenticated]);

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
        {/* All primary advertisements share one top carousel. */}
        <section className="campaign-grid" aria-label="Featured promotions">
          <article
            className="category-carousel campaign-panel-large"
            aria-label="Shop featured categories"
            onMouseEnter={() => setIsCategoryCarouselPaused(true)}
            onMouseLeave={() => setIsCategoryCarouselPaused(false)}
          >
            <div
              className="category-carousel-track"
              ref={categoryCarouselRef}
              onScroll={(event) => {
                const track = event.currentTarget;
                const nextIndex = Math.round(track.scrollLeft / track.clientWidth);
                setActiveCategorySlide(nextIndex % categorySlides.length);
                if (nextIndex > 0) setShowSwipeHint(false);

                window.clearTimeout(categoryScrollEndTimerRef.current);
                categoryScrollEndTimerRef.current = window.setTimeout(() => {
                  const settledIndex = Math.round(track.scrollLeft / track.clientWidth);
                  if (settledIndex !== categorySlides.length) return;

                  track.style.scrollBehavior = 'auto';
                  track.style.scrollSnapType = 'none';
                  track.scrollLeft = 0;

                  window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                      track.style.scrollBehavior = '';
                      track.style.scrollSnapType = '';
                    });
                  });
                }, 100);
              }}
            >
              {carouselSlides.map((slide, index) => (
                <section
                  className="campaign-panel category-carousel-slide"
                  key={`${slide.category}-${index}`}
                  style={fullPanelStyle(slide.image, 'position' in slide ? slide.position : undefined)}
                  aria-label={slide.category}
                >
                  <div className="campaign-copy campaign-copy-light">
                    <p>{slide.kicker}</p>
                    <h2>{slide.title}</h2>
                    <blockquote className={`category-slide-slogan slogan-${slide.sloganStyle}`}>
                      <span>{slide.slogan}</span>
                    </blockquote>
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

        </section>

        <header className="discover-marketplace-heading">
          <h2>Discover what’s moving</h2>
          <p>Curated finds from the community and beyond.</p>
        </header>

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
              <p>WHAT’S RISING</p>
              <h2>Trending Now</h2>
              <span>The pieces gaining attention fastest right now</span>
              <button onClick={() => navigate('/home?collection=trending')}>Explore trending</button>
            </div>
          </article>

          <article
            className="campaign-panel marketplace-promo marketplace-promo-fresh"
            style={fullPanelStyle(promoUnder100)}
          >
            <div className="campaign-copy">
              <p>GREAT FINDS, SMALLER PRICES</p>
              <h2>Under $100</h2>
              <span>Designer style, always within reach</span>
              <button onClick={() => navigate('/home?maxPrice=100')}>Shop under $100</button>
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

        {/* Supporting campaigns keep the page useful without competing with listings. */}
        <section className="campaign-lower" aria-label="More featured promotions">
          <article className="campaign-panel campaign-panel-wide campaign-new-week" style={fullPanelStyle(promoNewWeek)}>
            <div className="campaign-copy">
              <p>FRESHLY LISTED</p>
              <h2>New This Week</h2>
              <span>Handpicked arrivals from our community.</span>
              <button onClick={() => navigate('/home?collection=new-this-week')}>Browse new arrivals</button>
            </div>
            <span className="sponsored-label">Sponsored</span>
          </article>
          <div className="campaign-trust-grid">
            <article className="campaign-panel campaign-trust-card" style={fullPanelStyle(promoMostSaved)}>
              <div className="campaign-copy">
                <p>COMMUNITY SIGNAL</p>
                <h3>Most Saved</h3>
                <span>The pieces shoppers keep coming back to.</span>
                <button onClick={() => navigate('/home?collection=most-saved')}>See most saved</button>
              </div>
            </article>
            <article className="campaign-panel campaign-trust-card" style={fullPanelStyle(promoAuthenticated)}>
              <div className="campaign-copy">
                <p>BUY WITH CONFIDENCE</p>
                <h3>Authenticated Icons</h3>
                <span>Recognizable designs, checked with care.</span>
                <button onClick={() => navigate('/home?collection=authenticated')}>Explore authenticated</button>
              </div>
            </article>
            <article className="campaign-panel campaign-trust-card" style={fullPanelStyle(promoCompleteLook)}>
              <div className="campaign-copy">
                <p>STYLE IT TOGETHER</p>
                <h3>Complete the Look</h3>
                <span>Thoughtful pairings across every category.</span>
                <button onClick={() => navigate('/home?collection=complete-the-look')}>Build your look</button>
              </div>
            </article>
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
                <button type="button" onClick={() => navigate('/about')}>About us</button>
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
                <button type="button" onClick={() => navigate('/privacy-policy')}>Privacy policy</button>
                <button type="button" onClick={() => navigate('/terms-of-use')}>Terms of use</button>
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
