import { useState, type FormEvent } from 'react';
import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import api from '../api/axios';
import './Login.css';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    if (newPassword.length < 6) {
      setError('Password must have at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email,
        newPassword,
      });

      navigate('/login', {
        replace: true,
      });
    } catch {
      setError('Could not reset your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-panel">
        <div className="login-logo">chasel</div>

        <h1>Reset Password</h1>

        <p
          style={{
            color: '#8f8174',
            fontSize: '14px',
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          Create a new password for:
          <br />
          {email}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />

          <input
            type="password"
            placeholder="confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>

      <div className="login-illustration">
        <div className="illustration-shape" />
      </div>
    </div>
  );
}

export default ResetPassword;