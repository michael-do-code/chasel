import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      navigate('/sell-item');
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
            <a href="#">Forgot password</a>
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
      </div>

      <div className="login-illustration">
        <div className="illustration-shape" />
      </div>
    </div>
  );
}

export default Login;