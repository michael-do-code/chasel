import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './EditProfile.css';

interface UserProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  location: string | null;
}

function EditProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchStates();
  }, []);

  const fetchProfile = async () => {
    const res = await api.get<UserProfile>('/users/me');
    setProfile(res.data);
    setFirstName(res.data.firstName ?? '');
    setLastName(res.data.lastName ?? '');
    setPhone(res.data.phone ?? '');
    setLocation(res.data.location ?? '');
  };

  const fetchStates = async () => {
    const res = await api.get<string[]>('/options/states');
    setStates(res.data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const res = await api.put<UserProfile>('/users/me', { firstName, lastName, phone, location });
      setProfile(res.data);
      setMessage('Profile updated.');
    } catch (err) {
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="profile-container">
      <div className="profile-panel">
        <div className="profile-logo">chasel</div>

        <div className="profile-header">
          <h1>Edit Profile</h1>
          <button type="button" className="profile-back-btn" onClick={() => navigate(-1)}>Back</button>
        </div>

        <p className="profile-email">{profile.email}</p>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">First name</label>
            <input
              type="text"
              className="form-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Last name</label>
            <input
              type="text"
              className="form-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <select
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Select a state...</option>
              {states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {error && <p className="profile-error">{error}</p>}
          {message && <p className="profile-success">{message}</p>}

          <button type="submit" className="btn-submit" disabled={saving}>
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
