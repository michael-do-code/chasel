import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import React from 'react';
import './Login.css';
import { clearCuratedCart, getCuratedCart } from '../utils/curatedCart';

interface LoginNavigationState {
  message?: string;
  checkout?: boolean;
  returnTo?: string;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as LoginNavigationState | null;
  const sessionMessage = navigationState?.message;
  const isCheckoutLogin = navigationState?.checkout === true;
  const returnTo = navigationState?.returnTo || '/discover';

  const continueAsGuest = () => {
    if (isCheckoutLogin) {
      navigate(returnTo, { state: { openCartCheckout: true } });
      return;
    }
    navigate('/discover');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token);
      if (isCheckoutLogin) {
        const localItems = getCuratedCart();
        for (const item of localItems) {
          for (let quantity = 0; quantity < item.quantity; quantity += 1) {
            await api.post(`/cart/items/${item.productId}`);
          }
        }
        clearCuratedCart();
        navigate(returnTo, { state: { openCartCheckout: true } });
        return;
      }
      navigate('/welcome', {
        state: { type: 'login' },
      });
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-panel">
        <div className="login-logo">chasel</div>
        <h1>Log In</h1>

        <p className="login-checkout-intro">
          Sign in to use your account, or continue without creating one.
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="email id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="login-options">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password">Forgot password</Link>
          </div>

          {(error || sessionMessage) && (
            <p className="login-error">{error || sessionMessage}</p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="login-divider"><span>or</span></div>
        <button className="guest-checkout-button" type="button" onClick={continueAsGuest}>
          Continue as guest
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#AEA397' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#956F4C', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>

      <div className="login-illustration login-video-panel">
      <video
        className="login-fashion-video"
        autoPlay
        muted
        loop
        playsInline
          >
        <source src="/videos/login-fashion.mp4" type="video/mp4" />
      </video>
      </div>
    </div>
  );
}

export default Login;
