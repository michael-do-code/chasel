import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import BookmarkIcon from '../components/BookmarkIcon';
import ProductImageCarousel from '../components/ProductImageCarousel';
import { curatedListings } from '../data/curatedListings';
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
import priceDropsEditorial from '../assets/price-drops-static-background-v2.png';
import priceDropsBag from '../assets/price-drops-bag-layer.png';
import priceDropsChair from '../assets/price-drops-chair-layer.png';
import priceDropsShoes from '../assets/price-drops-shoes-layer.png';
import priceDropsBelt from '../assets/price-drops-belt-layer.png';
import promoTrendingNowBase from '../assets/trending-now-clean-background-v6.png';
import trendingCard01 from '../assets/trending-card-01-clean.png';
import trendingCard02 from '../assets/trending-card-02-clean.png';
import trendingCard03 from '../assets/trending-card-03-clean.png';
import under100Handbag from '../assets/under-100-community-handbag.png';
import under100Cardigan from '../assets/under-100-community-cardigan.png';
import under100Boots from '../assets/under-100-community-boots.png';
import under100Scarf from '../assets/under-100-community-scarf.png';
import under100Watch from '../assets/under-100-community-watch.png';
import promoNewWeekCollage from '../assets/promo-new-week-community-collage.png';
import promoNewWeekCollage02 from '../assets/promo-new-week-community-collage-02.png';
import promoNewWeekCollage03 from '../assets/promo-new-week-community-collage-03.png';
import promoNewWeekCollage04 from '../assets/promo-new-week-community-collage-04.png';
import '../styles/marketplace.css';
import './Discover.css';
import './DiscoverOverrides.css';

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
  { category: 'Seasonal Edit', kicker: 'THE SEASONAL EDIT', title: 'Considered pieces. Loved for longer.', slogan: 'Chosen with care, worn with purpose, and loved through every chapter.', sloganStyle: 'editorial', button: 'Shop the collection', href: '/browsing?category=All%20Items', image: discoverHeroFrame04, position: 'center top' },
  { category: 'Home', kicker: 'NEW CATEGORY', title: 'Home Refresh', slogan: 'A beautiful life begins in the rooms that hold your quietest, happiest moments.', sloganStyle: 'graceful', button: 'Shop home', href: '/browsing?category=Home', image: promoHome },
  { category: 'Handbags', kicker: 'ICONIC CARRYALLS', title: 'Designer Spotlight', slogan: 'Carry what matters, and let every thoughtful detail speak before you do.', sloganStyle: 'signature', button: 'Explore handbags', href: '/browsing?category=Handbags', image: promoDesigner },
  { category: 'Clothing', kicker: 'EVERYDAY EXPRESSION', title: 'Clothing Edit', slogan: 'Dress for the life you live, with pieces that feel effortless and entirely your own.', sloganStyle: 'modern', button: 'Explore clothing', href: '/browsing?category=Clothing', image: promoCategoryClothing },
  { category: 'Footwear', kicker: 'STEP INTO STYLE', title: 'Footwear Focus', slogan: 'Move with purpose, step with confidence, and arrive in unmistakable style.', sloganStyle: 'dynamic', button: 'Explore footwear', href: '/browsing?category=Footwear', image: promoCategoryFootwear },
  { category: 'Accessories', kicker: 'DETAILS THAT DEFINE', title: 'Finishing Touches', slogan: 'The smallest details have a beautiful way of leaving the strongest impression.', sloganStyle: 'flourish', button: 'Explore accessories', href: '/browsing?category=Accessories', image: promoCategoryAccessories },
  { category: 'Beauty', kicker: 'SEALED & SELECTED', title: 'Beauty Essentials', slogan: 'Honor the quiet rituals that reveal your natural light and lasting confidence.', sloganStyle: 'soft', button: 'Discover beauty', href: '/browsing?category=Beauty', image: promoBeauty },
  { category: 'Jewelry', kicker: 'LIGHT TO TREASURE', title: 'Jewelry Selection', slogan: 'Wear a little light close to you, made to shimmer through every chapter.', sloganStyle: 'luminous', button: 'Explore jewelry', href: '/browsing?category=Jewelry', image: promoCategoryJewelry },
  { category: 'Watches', kicker: 'TIMELESS CRAFT', title: 'Timeless Watches', slogan: 'Time moves forward, while true craftsmanship and personal style remain.', sloganStyle: 'precision', button: 'Explore watches', href: '/browsing?category=Watches', image: promoCategoryWatches },
];

const carouselSlides = [...categorySlides, categorySlides[0]];

const under100Slides = [
  { name: 'Leather Crossbody', detail: 'Everyday structure in rich oxblood leather.', price: 64, image: under100Handbag },
  { name: 'Cable-Knit Cardigan', detail: 'A polished layer with timeless texture.', price: 48, image: under100Cardigan },
  { name: 'Chocolate Ankle Boots', detail: 'A refined staple made for repeat wear.', price: 89, image: under100Boots },
  { name: 'Silk Scarf & Pendant', detail: 'Two finishing touches, one easy find.', price: 36, image: under100Scarf },
  { name: 'Classic Leather Watch', detail: 'Quiet polish for every day of the week.', price: 75, image: under100Watch },
];

const newWeekCollages = [
  promoNewWeekCollage,
  promoNewWeekCollage02,
  promoNewWeekCollage03,
  promoNewWeekCollage04,
];

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
  backgroundRepeat: 'no-repeat',
});

function Discover() {
  const [highlightedListings, setHighlightedListings] = useState<Listing[]>(
    curatedListings,
  );
  const [activeCategorySlide, setActiveCategorySlide] = useState(0);
  const [isCategoryCarouselPaused, setIsCategoryCarouselPaused] = useState(false);
  const [activeUnder100Slide, setActiveUnder100Slide] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [isNewWeekRevealed, setIsNewWeekRevealed] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [newWeekCycle, setNewWeekCycle] = useState(0);
  const [savedProductIds, setSavedProductIds] = useState<number[]>([]);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const { setSearchItems } = useSearch();
  const categoryCarouselRef = useRef<HTMLDivElement>(null);
  const categoryScrollEndTimerRef = useRef<number | undefined>(undefined);
  const newWeekRef = useRef<HTMLElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const activeNewWeekCollage = newWeekCollages[newWeekCycle % newWeekCollages.length];

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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setActiveUnder100Slide((current) => (current + 1) % under100Slides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const panel = newWeekRef.current;
    if (!panel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setIsNewWeekRevealed(true);
      observer.disconnect();
    }, { threshold: 0.35 });

    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isNewWeekRevealed) return;
    const timer = window.setInterval(() => {
      setNewWeekCycle((current) => current + 1);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [isNewWeekRevealed]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [listingsResponse, savedResponse] = await Promise.all([
          api.get<Listing[]>('/listings'),
          api.get<SavedItem[]>('/saved-items'),
        ]);
        const availableListings = listingsResponse.data.length >= 10
          ? listingsResponse.data
          : [...listingsResponse.data, ...curatedListings].slice(0, 10);
        setHighlightedListings(getRandomListings(availableListings, 10));
        setSavedProductIds(savedResponse.data.map((item) => item.productId));
        setSearchItems(availableListings);
      } catch (err) {
        console.error('Error fetching home data:', err);
        setHighlightedListings(curatedListings);
        setSearchItems(curatedListings);
      }
    };

    fetchHomeData();
  }, [location.key, setSearchItems]);

  const toggleSaved = async (productId: number) => {
    const isSaved = savedProductIds.includes(productId);

    if (productId < 0) {
      setSavedProductIds((current) => isSaved
        ? current.filter((id) => id !== productId)
        : [...current, productId]);
      return;
    }

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
            style={fullPanelStyle(priceDropsEditorial)}
          >
            <div className="price-drop-product-layers" aria-hidden="true">
              <img className="price-drop-product product-bag" src={priceDropsBag} alt="" />
              <img className="price-drop-product product-chair" src={priceDropsChair} alt="" />
              <img className="price-drop-product product-shoes" src={priceDropsShoes} alt="" />
              <img className="price-drop-product product-belt" src={priceDropsBelt} alt="" />
            </div>
            <button
              type="button"
              className="price-drop-editorial-link"
              aria-label="Shop newly reduced prices"
              onClick={() => navigate('/browsing')}
            >
              <span className="price-drop-center">
                <span className="price-drop-kicker">JUST REDUCED</span>
                <span className="price-drop-heading" aria-label="New price">
                  <span>NEW</span>
                  <span>PRICE</span>
                </span>
                <span className="price-drop-description">Fresh markdowns worth a second look.</span>
                <span className="price-drop-cta">Shop new prices <span aria-hidden="true">→</span></span>
              </span>
            </button>
          </article>

          <article
            className="campaign-panel marketplace-promo marketplace-promo-trending"
            style={fullPanelStyle(promoTrendingNowBase)}
          >
            <div className="trending-card-layers" aria-hidden="true">
              <span className="trending-tape-scrap tape-scrap-01a" />
              <span className="trending-tape-scrap tape-scrap-01b" />
              <span className="trending-tape-scrap tape-scrap-02a" />
              <span className="trending-tape-scrap tape-scrap-02b" />
              <img className="trending-card-layer trending-card-01" src={trendingCard01} alt="" />
              <img className="trending-card-layer trending-card-02" src={trendingCard02} alt="" />
              <img className="trending-card-layer trending-card-03" src={trendingCard03} alt="" />
            </div>
            <button
              type="button"
              className="trending-editorial-link"
              aria-label="Shop the Trending Now edit"
              onClick={() => navigate('/browsing?collection=trending')}
            >
              <span>Shop the edit</span>
            </button>
          </article>

          <article
            className="campaign-panel marketplace-promo marketplace-promo-fresh under-100-campaign"
            aria-label="Shop five featured finds under $100"
          >
            <div className="under-100-slide-images" aria-hidden="true">
              {under100Slides.map((slide, index) => (
                <div
                  key={slide.name}
                  className={index === activeUnder100Slide ? 'active' : ''}
                  style={fullPanelStyle(slide.image)}
                />
              ))}
            </div>
            <div className="campaign-copy under-100-copy">
              <p className="under-100-kicker">EVERYTHING SHOWN IS UNDER $100</p>
              <h2>Great style.<br /><em>Smaller prices.</em></h2>
              <div className="under-100-item-copy" aria-live="polite">
                <h3>{under100Slides[activeUnder100Slide].name}</h3>
                <p>{under100Slides[activeUnder100Slide].detail}</p>
              </div>
              <button onClick={() => navigate('/browsing?maxPrice=100')}>
                Shop all items under $100 <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="under-100-price" aria-live="polite">
              <small>THIS FIND</small>
              <strong>${under100Slides[activeUnder100Slide].price}</strong>
              <span>UNDER $100</span>
            </div>
            <div className="under-100-dots" aria-label="Choose an under $100 featured item">
              {under100Slides.map((slide, index) => (
                <button
                  type="button"
                  key={slide.name}
                  className={index === activeUnder100Slide ? 'active' : ''}
                  aria-label={`Show ${slide.name}, $${slide.price}`}
                  aria-current={index === activeUnder100Slide ? 'true' : undefined}
                  onClick={() => setActiveUnder100Slide(index)}
                />
              ))}
            </div>
          </article>

        </section>

        {/* Listings Section */}
        <section className="listings-section">
          <div className="section-heading-row">
            <h2 className="section-title">From the community</h2>
            <button className="view-all-button" onClick={() => navigate('/browsing')}>
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
                onClick={() => navigate(item.id < 0
                  ? `/browsing?category=${encodeURIComponent(item.category)}`
                  : `/items/${item.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    navigate(item.id < 0
                      ? `/browsing?category=${encodeURIComponent(item.category)}`
                      : `/items/${item.id}`);
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

        <section className="campaign-lower" aria-label="More featured promotions">
          <article
            ref={newWeekRef}
            className={`campaign-panel campaign-panel-wide campaign-new-week${isNewWeekRevealed ? ' is-revealed' : ''}`}
            style={fullPanelStyle(activeNewWeekCollage)}
          >
            <div className="new-week-photo-reveal" aria-hidden="true">
              {newWeekCollages.map((collage, index) => (
                <img
                  key={collage}
                  className={`new-week-collage-base${index === newWeekCycle % newWeekCollages.length ? ' active' : ''}`}
                  src={collage}
                  alt=""
                />
              ))}
              <div key={newWeekCycle} className="new-week-photo-pieces">
                {Array.from({ length: 14 }, (_, index) => (
                  <img
                    key={`${newWeekCycle}-${index}`}
                    className={`new-week-photo-piece new-week-photo-piece-${index + 1}`}
                    src={activeNewWeekCollage}
                    alt=""
                  />
                ))}
              </div>
            </div>
            <div className="new-week-edition" aria-hidden="true">
              <span>WEEKLY EDIT</span>
              <span>№ 24</span>
            </div>
            <div className="campaign-copy new-week-copy">
              <p><span aria-hidden="true" />JUST LISTED</p>
              <h2>New this<br /><em>week</em></h2>
              <span>New finds posted by our community, all in one thoughtfully curated edit.</span>
              <button onClick={() => navigate('/browsing?collection=new-this-week')}>
                Explore new arrivals <span aria-hidden="true">→</span>
              </button>
            </div>
            <span className="sponsored-label">Sponsored</span>
          </article>
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
