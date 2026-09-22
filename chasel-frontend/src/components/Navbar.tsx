import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useCart } from '../context/CartContext';
import { useSavedCount } from '../context/SavedItemsContext';

/** Badges stay a small disc, so anything past 9 collapses to "9+". */
const formatBadge = (value: number) => (value > 9 ? '9+' : String(value));
import api from '../api/axios';
import Cart from '../pages/Cart';
import Notifications from '../pages/Notifications';
import BookmarkIcon from './BookmarkIcon';
import CartIcon from './CartIcon';
import MessageIcon from './MessageIcon';
import BellIcon from './BellIcon';
import SearchIcon from './SearchIcon';
import './Navbar.css';

/** "New" is Browse pre-filtered to the new-this-week collection. */
const NEW_ARRIVALS_PATH = '/browsing?collection=new-this-week';

interface UserProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface SearchSuggestion {
  value: string;
  type: 'Item' | 'Brand' | 'Category' | 'Suggested search';
}

const categories = [
  'Clothing',
  'Footwear',
  'Handbags',
  'Accessories',
  'Jewelry',
  'Watches',
  'Beauty',
  'Home',
];
const fashionSearchIdeas = [
  'Blazer outfit', 'Blazer dress', 'Black blazer', 'Brown blazer',
  'Leather jacket', 'Leather pants', 'Leather skirt', 'Leather handbag',
  'Leather boots', 'Denim jacket', 'Denim jeans', 'Denim skirt',
  'Silk dress', 'Silk blouse', 'Silk scarf', 'Cashmere sweater',
  'Cashmere cardigan', 'Wool coat', 'Trench coat', 'Winter coat',
  'Summer dress', 'Evening dress', 'Mini dress', 'Midi dress',
  'Maxi dress', 'White shirt', 'Button-down shirt', 'Wide-leg pants',
  'High-waisted pants', 'Cargo pants', 'Tailored trousers', 'Vintage clothing',
  'Designer handbag', 'Shoulder bag', 'Crossbody bag', 'Tote bag',
  'Brown boots', 'Ankle boots', 'Knee-high boots', 'White sneakers',
  'Running shoes', 'High heels', 'Gold watch', 'Luxury watch',
  'Gold jewelry', 'Silver jewelry', 'Pearl necklace', 'Statement earrings',
  'Minimalist outfit', 'Business casual', 'Formal outfit', 'Streetwear outfit',
  'Vacation outfit',
];

function getInitials(profile: UserProfile): string {
  const first = profile.firstName?.trim()[0];
  const last = profile.lastName?.trim()[0];
  if (first && last) return (first + last).toUpperCase();
  if (first) return first.toUpperCase();
  return profile.email[0].toUpperCase();
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const { searchQuery, setSearchQuery, searchItems } = useSearch();
  const isAuthenticated = !!token;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages] = useState(0);
  const { count: cartCount } = useCart();
  const { count: savedCount } = useSavedCount();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const hasMatchingItem = searchItems.some((item) =>
    [item.title, item.brand, item.category, item.description, item.condition, item.size]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch)
  );
  const searchSuggestions = (() => {
    if (!normalizedSearch) return [];

    const candidates: SearchSuggestion[] = [
      ...searchItems.map((item) => ({ value: item.title, type: 'Item' as const })),
      ...searchItems.map((item) => ({ value: item.brand, type: 'Brand' as const })),
      ...categories.map((value) => ({ value, type: 'Category' as const })),
      ...fashionSearchIdeas.map((value) => ({
        value,
        type: 'Suggested search' as const,
      })),
    ];

    return candidates
      .filter(
        (suggestion, index, all) =>
          suggestion.value.toLowerCase().includes(normalizedSearch) &&
          all.findIndex(
            (candidate) =>
              candidate.value.toLowerCase() === suggestion.value.toLowerCase() &&
              candidate.type === suggestion.type
          ) === index
      )
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
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    if (location.pathname !== '/browsing') navigate('/browsing');
  };

  useEffect(() => {
    if (!token) return;

    api
      .get<UserProfile>('/users/me')
      .then((res) => setProfile(res.data))
      .catch((error) => {
        console.error('Could not load navbar profile:', error);
        setProfile(null);
      });
  }, [token]);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.navbar-notifications-menu')) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!location.state?.scrollToTop) return;

    const scrollFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });
    });

    return () => {
      window.cancelAnimationFrame(scrollFrame);
    };
  }, [location.key, location.state]);

  const handleLogoClick = () => {
    navigate('/discover', {
      replace: location.pathname === '/discover',
      state: { refreshCommunity: Date.now(), scrollToTop: Date.now() },
    });
  };

  const handleBrowseClick = () => {
    navigate('/browsing', {
      replace: location.pathname === '/browsing',
      state: { scrollToTop: Date.now() },
    });
  };

  // Browse and New share /browsing, so the collection param decides which of
  // the two carries the active underline.
  const isNewArrivals =
    location.pathname === '/browsing' &&
    new URLSearchParams(location.search).get('collection') === 'new-this-week';
  const isBrowseActive = location.pathname === '/browsing' && !isNewArrivals;

  const submitSearch = () => {
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    if (location.pathname !== '/browsing') navigate('/browsing');
  };

  const handleCartClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setCartOpen(true);
  };

  const handleMessagesClick = () => {
    navigate(isAuthenticated ? '/messages' : '/login');
  };

  const handleNotificationsClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setNotificationsOpen((current) => !current);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left: Wordmark & Nav Links */}
        <div className="navbar-left">
          <button
            type="button"
            className="navbar-logo"
            onClick={handleLogoClick}
            aria-label="Go to Chasel home"
          >
            chasel
          </button>

          <div className="navbar-links">
            <a
              href="#browse"
              className={`nav-item ${isBrowseActive ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleBrowseClick();
              }}
            >
              Browse
            </a>
            <a
              href="#new"
              className={`nav-item ${isNewArrivals ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(NEW_ARRIVALS_PATH, { state: { scrollToTop: Date.now() } });
              }}
            >
              New
            </a>
          </div>
        </div>

        {/* Center: Search */}
        <form
          className="navbar-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <span className="navbar-search-icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search brands or pieces"
            className="search-box"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setShowSuggestions(true);
              setActiveSuggestion(-1);
              if (location.pathname !== '/browsing') navigate('/browsing');
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setShowSuggestions(false)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setShowSuggestions(false);
                return;
              }
              if (!showSuggestions || searchSuggestions.length === 0) {
                if (event.key === 'Enter' && location.pathname !== '/browsing') {
                  navigate('/browsing');
                }
                return;
              }
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
              }
            }}
            role="combobox"
            aria-label="Search items, brands, or categories"
            aria-expanded={showSuggestions && Boolean(normalizedSearch)}
            aria-autocomplete="list"
          />
          <button type="submit" className="navbar-search-submit">
            Search
          </button>

          {showSuggestions && normalizedSearch && (
            <div className="navbar-search-suggestions" role="listbox">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={activeSuggestion === index}
                  className={
                    activeSuggestion === index
                      ? 'navbar-search-suggestion active'
                      : 'navbar-search-suggestion'
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
              {!hasMatchingItem && (
                <p className="navbar-search-empty" role="status">
                  No items match “{searchQuery}”. Try another name, brand, or category.
                </p>
              )}
            </div>
          )}
        </form>

        {/* Right: Icons, account, and the primary call to action */}
        <div className="navbar-right">
          <div className="navbar-icons">
            {/* Messages */}
            <button
              className="navbar-icon-btn"
              title="Messages"
              aria-label="Messages"
              onClick={handleMessagesClick}
            >
              <MessageIcon />
              {messages > 0 && <span className="navbar-dot" aria-hidden="true" />}
            </button>

            {/* Notifications */}
            <div className="navbar-notifications-menu">
              <button
                className="navbar-icon-btn"
                title="Notifications"
                aria-label="Notifications"
                onClick={handleNotificationsClick}
              >
                <BellIcon />
                {unreadCount > 0 && <span className="navbar-dot" aria-hidden="true" />}
              </button>

              <Notifications
                open={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                onUnreadCountChange={setUnreadCount}
              />
            </div>

            {/* Saved Items */}
            <button
              className="navbar-icon-btn"
              title="Saved Items"
              aria-label={
                savedCount > 0 ? `Saved items, ${savedCount} saved` : 'Saved items'
              }
              onClick={() => navigate('/saved')}
            >
              <BookmarkIcon variant="outline" />
              {savedCount > 0 && (
                <span className="navbar-badge" aria-hidden="true">
                  {formatBadge(savedCount)}
                </span>
              )}
            </button>

            {/* Cart — the badge caps at "9+" so it stays a small disc. */}
            <button
              className="navbar-icon-btn"
              title="Cart"
              aria-label={
                cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'
              }
              onClick={handleCartClick}
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="navbar-badge" aria-hidden="true">
                  {formatBadge(cartCount)}
                </span>
              )}
            </button>
          </div>

          {/* Account avatar (logged in, links straight to Profile) or Login button (guest) */}
          {isAuthenticated ? (
            <button
              className="navbar-avatar"
              onClick={() => navigate('/profile')}
              title="Go to your profile"
            >
              {profile ? getInitials(profile) : 'A'}
            </button>
          ) : (
            <button className="navbar-login" onClick={() => navigate('/login')}>
              Login
            </button>
          )}

          {/* Collapses to a "+" on narrow screens so the row still fits. */}
          <button
            className="navbar-cta"
            aria-label="List an item"
            onClick={() => navigate('/sell-item')}
          >
            <span className="navbar-cta-label">List an item</span>
            <span className="navbar-cta-icon" aria-hidden="true">+</span>
          </button>
        </div>
      </div>
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />
    </nav>
  );
}

export default Navbar;
