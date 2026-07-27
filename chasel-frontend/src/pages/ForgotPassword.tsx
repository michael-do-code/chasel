import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Login.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', {
        email,
      });

      navigate('/verify-code', {
        state: { email },
      });
    } catch {
      setError('Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-panel">
        <div className="login-logo">chasel</div>

        <h1>Forgot Password</h1>

        <p
          style={{
            color: '#8f8174',
            fontSize: '14px',
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          Enter your email address to receive a verification code.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </form>

        <p
          style={{
            marginTop: '20px',
            textAlign: 'center',
          }}
        >
          <Link
            to="/login"
            style={{
              color: '#956F4C',
              fontSize: '13px',
            }}
          >
            Back to Login
          </Link>
        </p>
      </div>

      <div className="login-illustration">
        <div className="illustration-shape" />
      </div>
    </div>
  );
}

export default ForgotPassword;