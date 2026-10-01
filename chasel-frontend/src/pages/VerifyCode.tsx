import { useState, type FormEvent } from 'react';
import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import api from '../api/axios';
import './Login.css';

function VerifyCode() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email as string | undefined;
  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/verify-code', {
        email,
        code,
      });

      navigate('/reset-password', {
        replace: true,
        state: { email },
      });
    } catch {
      setError('The verification code is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-panel">
        <div className="login-logo">chasel</div>

        <h1>Verify Code</h1>

        <p
          style={{
            color: '#8f8174',
            fontSize: '14px',
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          Enter the 6-digit verification code for:
          <br />
          {email}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setCode(value.slice(0, 6));
            }}
            minLength={6}
            maxLength={6}
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      </div>

      <div className="login-illustration login-video-panel">
        <video className="login-fashion-video" autoPlay muted loop playsInline>
          <source src="/videos/login-fashion.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}

export default VerifyCode;
