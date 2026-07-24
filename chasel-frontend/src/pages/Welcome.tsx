import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Welcome.css';

function Welcome() {
  const navigate = useNavigate();
  const location = useLocation();

  const type = location.state?.type;

  const isLogin = type === 'login';
  const isVerification = type === 'verification';

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home', { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  let label = 'Welcome to';
  let title = 'Dress for Less ♡';
  let message = 'Your account has been created successfully.';

  if (isLogin) {
    label = 'Welcome back to';
    title = 'Good to see you again ♡';
    message = 'You have logged in successfully.';
  }

  if (isVerification) {
    label = 'Verification successful';
    title = 'Welcome back ♡';
    message = 'Your identity has been verified successfully.';
  }

  return (
    <main className="welcome-page">
      <section className="welcome-box">
        <p className="welcome-label">{label}</p>

        <h1>chasel.</h1>

        <h2>{title}</h2>

        <p className="welcome-message">
          {message}
          <br />
          We're getting everything ready for you...
        </p>

        <div className="welcome-progress" />
      </section>
    </main>
  );
}

export default Welcome;