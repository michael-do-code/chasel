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

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get<UserProfile>('/users/me').then((res) => setProfile(res.data));
  }, [isAuthenticated]);

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

        {/* Right: Account & Logout */}
        <div className="navbar-right">
          {profile && (
            <div
              className="navbar-avatar"
              onClick={() => navigate('/profile')}
              title="View profile"
            >
              {getInitials(profile)}
            </div>
          )}
          <button
            className="nav-item nav-logout"
            onClick={handleLogout}
            title="Sign out"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
