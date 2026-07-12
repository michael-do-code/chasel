import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

interface UserProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string | null;
}

function formatMemberSince(createdAt: string | null): string {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

function getInitials(profile: UserProfile): string {
  const first = profile.firstName?.trim()[0];
  const last = profile.lastName?.trim()[0];
  if (first && last) return (first + last).toUpperCase();
  if (first) return first.toUpperCase();
  return profile.email[0].toUpperCase();
}

function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const res = await api.get<UserProfile>('/users/me');
    setProfile(res.data);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!profile) {
    return null;
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email;

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="dashboard-avatar">{getInitials(profile)}</div>
        <h2>{fullName}</h2>
        <dl className="dashboard-info">
          <dt>Email</dt>
          <dd>{profile.email}</dd>
          <dt>Phone</dt>
          <dd>{profile.phone || '—'}</dd>
          <dt>Member since</dt>
          <dd>{formatMemberSince(profile.createdAt) || '—'}</dd>
        </dl>
        <Link to="/profile/edit" className="dashboard-edit-link">Edit Profile</Link>
        <button onClick={handleLogout}>Log out</button>
      </aside>

      <main className="dashboard-main">
        <h1>Products</h1>
        <div className="dashboard-empty">No products yet</div>
      </main>
    </div>
  );
}

export default Profile;
