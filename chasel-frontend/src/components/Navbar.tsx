import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Navbar.css';

interface UserProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

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
  const { token, logout } = useAuth();
  const isAuthenticated = !!token;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifications] = useState(0);
  const [messages] = useState(0);
  const [cart] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get<UserProfile>('/users/me').then((res) => setProfile(res.data));
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.navbar-account-menu')) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left: Logo & Nav Links */}
        <div className="navbar-left">
          <div className="navbar-logo" onClick={() => navigate('/home')}>
            chasel
          </div>

          <div className="navbar-links">
            <a
              href="#browse"
              className={`nav-item ${isActive('/home') ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                navigate('/home');
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate('/home');
              }
            }}
          />
        </div>

        {/* Right: Icons & Account */}
        <div className="navbar-right">
          {/* Messages Icon */}
          <button
            className="navbar-icon-btn"
            title="Messages"
            onClick={() => navigate('/messages')}
          >
            <span className="icon">💬</span>
            {messages > 0 && <span className="badge">{messages}</span>}
          </button>

          {/* Notifications Icon */}
          <button
            className="navbar-icon-btn"
            title="Notifications"
            onClick={() => navigate('/notifications')}
          >
            <span className="icon">🔔</span>
            {notifications > 0 && <span className="badge">{notifications}</span>}
          </button>

          {/* Cart Icon */}
          <button
            className="navbar-icon-btn"
            title="Cart"
            onClick={() => navigate('/cart')}
          >
            <span className="icon">🛍️</span>
            {cart > 0 && <span className="badge">{cart}</span>}
          </button>

          {/* Account Dropdown */}
          <div className="navbar-account-menu">
            {profile && (
              <button
                className="navbar-avatar"
                onClick={() => setAccountOpen(!accountOpen)}
                title="Account menu"
              >
                {getInitials(profile)}
              </button>
            )}

            {accountOpen && (
              <div className="account-dropdown">
                <div className="dropdown-header">
                  {profile?.firstName && profile?.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile?.email}
                </div>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/profile');
                    setAccountOpen(false);
                  }}
                >
                  👤 Profile
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/saved');
                    setAccountOpen(false);
                  }}
                >
                  ❤️ Saved Items
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/purchases');
                    setAccountOpen(false);
                  }}
                >
                  📦 Purchases
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/listings');
                    setAccountOpen(false);
                  }}
                >
                  📋 My Listings
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/settings');
                    setAccountOpen(false);
                  }}
                >
                  ⚙️ Settings
                </button>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
