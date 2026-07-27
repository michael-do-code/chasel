import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import React from 'react';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token);
      navigate('/welcome', {
      state: { type: 'login' },
    });
    } catch (err) {
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

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="email id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <div className="login-social">
          <button className="social-btn" type="button" aria-label="Continue with Google">G</button>
          <button className="social-btn" type="button" aria-label="Continue with Twitter">𝕏</button>
        </div>

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