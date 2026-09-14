import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import api from '../api/axios';
import Cart from '../pages/Cart';
import Notifications from '../pages/Notifications';
import BookmarkIcon from './BookmarkIcon';
import CartIcon from './CartIcon';
import './Navbar.css';

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
  const [cart] = useState(0);
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
    if (location.pathname !== '/home') navigate('/home');
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
    navigate('/home', {
      replace: location.pathname === '/home',
      state: { scrollToTop: Date.now() },
    });
  };

  const isActive = (path: string) => location.pathname === path;

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
        {/* Left: Logo & Nav Links */}
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
              className={`nav-item ${isActive('/home') ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleBrowseClick();
              }}
            >
              Browse
            </a>
            <button
              className="nav-item nav-btn"
              onClick={() => navigate('/sell-item')}
            >
              List an Item
            </button>
          </div>
        </div>

        {/* Center: Search */}
        <div className="navbar-search">
          <input
            type="text"
            placeholder="Search items or brands..."
            className="search-box"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setShowSuggestions(true);
              setActiveSuggestion(-1);
              if (location.pathname !== '/home') navigate('/home');
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setShowSuggestions(false)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setShowSuggestions(false);
                return;
              }
              if (!showSuggestions || searchSuggestions.length === 0) {
                if (event.key === 'Enter' && location.pathname !== '/home') {
                  navigate('/home');
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
          <span className="navbar-search-icon" aria-hidden="true" />
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
        </div>

        {/* Right: Icons & Account */}
        <div className="navbar-right">
          {/* Messages Icon */}
          <button
            className="navbar-icon-btn"
            title="Messages"
            onClick={handleMessagesClick}
          >
            <span className="icon">💬</span>
            {messages > 0 && <span className="badge">{messages}</span>}
          </button>

          {/* Notifications Icon */}
          <div className="navbar-notifications-menu">
            <button
              className="navbar-icon-btn"
              title="Notifications"
              onClick={handleNotificationsClick}
            >
              <span className="icon">🔔</span>
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>

            <Notifications
              open={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
              onUnreadCountChange={setUnreadCount}
            />
          </div>

          {/* Saved Items Icon */}
          <button
            className="navbar-icon-btn"
            title="Saved Items"
            onClick={() => navigate('/saved')}
          >
            <span className="icon saved-icon">
              <BookmarkIcon />
            </span>
          </button>

          {/* Cart Icon */}
          <button
            className="navbar-icon-btn"
            title="Cart"
            onClick={handleCartClick}
          >
            <span className="icon cart-icon">
              <CartIcon />
            </span>
            {cart > 0 && <span className="badge">{cart}</span>}
          </button>

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
            <button className="nav-item nav-btn" onClick={() => navigate('/login')}>
              Login
            </button>
          )}
        </div>
      </div>
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />
    </nav>
  );
}

export default Navbar;
