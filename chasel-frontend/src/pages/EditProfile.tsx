import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PageHeading from '../components/editorial/PageHeading';
import { PROFILE_UPDATED_EVENT } from '../utils/profileEvents';
import './EditProfile.css';

interface UserProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  avatarUrl: string | null;
}

type FormFields = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  avatarUrl: string;
};

type FieldErrors = Partial<Record<keyof FormFields, string>>;

const PHONE_LENGTH = 10;
const ZIP_LENGTH = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const emptyForm: FormFields = {
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  avatarUrl: '',
};

function toForm(profile: UserProfile): FormFields {
  return {
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    phone: profile.phone ?? '',
    address: profile.address ?? '',
    city: profile.city ?? '',
    state: profile.state ?? '',
    zipCode: profile.zipCode ?? '',
    avatarUrl: profile.avatarUrl ?? '',
  };
}

// Mirrors the backend rules in UpdateProfileRequest so users see problems
// before submitting. Every field is optional; phone and ZIP just have to be
// well-formed when filled in.
function validate(form: FormFields): FieldErrors {
  const errors: FieldErrors = {};
  if (form.phone && !/^\d{10}$/.test(form.phone)) {
    errors.phone = 'Phone number must be exactly 10 digits.';
  }
  if (form.zipCode && !/^\d{5}$/.test(form.zipCode)) {
    errors.zipCode = 'ZIP code must be exactly 5 digits.';
  }
  return errors;
}

function getInitials(profile: UserProfile, form: FormFields): string {
  const first = form.firstName.trim()[0];
  const last = form.lastName.trim()[0];
  if (first && last) return (first + last).toUpperCase();
  if (first) return first.toUpperCase();
  return profile.email[0].toUpperCase();
}

function EditProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormFields>(emptyForm);
  const [states, setStates] = useState<string[]>([]);
  const [touched, setTouched] = useState<Partial<Record<keyof FormFields, boolean>>>({});
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get<UserProfile>('/users/me');
        setProfile(res.data);
        setForm(toForm(res.data));
      } catch {
        setLoadError('We could not load your profile. Please refresh and try again.');
      }
    };

    const loadStates = async () => {
      const res = await api.get<string[]>('/options/states');
      setStates(res.data);
    };

    void loadProfile();
    void loadStates();
  }, []);

  const errors = validate(form);
  const visibleError = (field: keyof FormFields) => (touched[field] ? errors[field] : undefined);

  const updateField = (field: keyof FormFields, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage('');
  };

  const markTouched = (field: keyof FormFields) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  // The photo is uploaded as soon as it's picked so we can preview it, but it
  // only becomes the profile photo once the form is saved.
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPhotoError('');
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('Photo must be 5 MB or smaller.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const res = await api.post<string[]>('/uploads', formData);
      updateField('avatarUrl', res.data[0]);
    } catch {
      setPhotoError('Upload failed. Please try another image.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (Object.keys(errors).length > 0) {
      setTouched({ phone: true, zipCode: true });
      return;
    }

    setSaving(true);
    try {
      const res = await api.put<UserProfile>('/users/me', form);
      setProfile(res.data);
      setForm(toForm(res.data));
      setTouched({});
      setMessage('Your profile has been updated.');
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(detail || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="edit-profile">
        <div className="edit-profile-shell">
          <p className="edit-profile-status edit-profile-status-error" role="alert">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="edit-profile">
        <div className="edit-profile-shell">
          <p className="edit-profile-status">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile">
      <div className="edit-profile-shell">
        <PageHeading
          kicker="Your account · Edit profile"
          title="Edit profile"
          lede="Keep your contact details and address current. We use them to prefill checkout."
        >
          <hr className="ed-rule edit-profile-rule" />
        </PageHeading>

        <Link to="/profile" className="edit-profile-back">← Back to profile</Link>

        <form className="edit-profile-form" onSubmit={handleSave} noValidate>
          <section className="edit-profile-section">
            <header className="edit-profile-section-heading">
              <span className="ed-kicker">01</span>
              <h2>Profile photo</h2>
            </header>

            <div className="edit-photo">
              <div className="edit-photo-preview" aria-hidden="true">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="" />
                ) : (
                  <span>{getInitials(profile, form)}</span>
                )}
              </div>

              <div className="edit-photo-body">
                <p className="edit-photo-copy">
                  Buyers and sellers see this next to your listings and messages.
                  A square image works best.
                </p>
                <div className="edit-photo-actions">
                  <button
                    type="button"
                    className="ed-btn ed-btn-outline"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? 'Uploading…' : form.avatarUrl ? 'Change photo' : 'Upload photo'}
                  </button>
                  {form.avatarUrl && (
                    <button
                      type="button"
                      className="ed-btn ed-btn-quiet"
                      onClick={() => updateField('avatarUrl', '')}
                      disabled={uploadingPhoto}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={photoInputRef}
                  id="avatar"
                  type="file"
                  accept={PHOTO_TYPES.join(',')}
                  className="visually-hidden"
                  onChange={handlePhotoChange}
                  aria-label="Upload profile photo"
                />
                <p className={photoError ? 'edit-field-error' : 'edit-field-hint'} role={photoError ? 'alert' : undefined}>
                  {photoError || 'JPG, PNG or WebP, up to 5 MB. Changes apply when you save.'}
                </p>
              </div>
            </div>
          </section>

          <section className="edit-profile-section">
            <header className="edit-profile-section-heading">
              <span className="ed-kicker">02</span>
              <h2>Personal details</h2>
            </header>

            <div className="edit-profile-grid">
              <div className="edit-field edit-field-wide">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  readOnly
                  aria-describedby="email-hint"
                />
                <p id="email-hint" className="edit-field-hint">Your email is your login and can't be changed.</p>
              </div>

              <div className="edit-field">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  maxLength={50}
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                />
              </div>

              <div className="edit-field">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  maxLength={50}
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                />
              </div>

              <div className={`edit-field edit-field-wide ${visibleError('phone') ? 'has-error' : ''}`}>
                <label htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="5125550123"
                  maxLength={PHONE_LENGTH}
                  value={form.phone}
                  // Digits only — anything else is dropped as it's typed or pasted.
                  onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, PHONE_LENGTH))}
                  onBlur={() => markTouched('phone')}
                  aria-invalid={Boolean(visibleError('phone'))}
                  aria-describedby={visibleError('phone') ? 'phone-error' : undefined}
                />
                {visibleError('phone') && (
                  <p id="phone-error" className="edit-field-error">{visibleError('phone')}</p>
                )}
              </div>
            </div>
          </section>

          <section className="edit-profile-section">
            <header className="edit-profile-section-heading">
              <span className="ed-kicker">03</span>
              <h2>Address</h2>
            </header>

            <div className="edit-profile-grid">
              <div className="edit-field edit-field-wide">
                <label htmlFor="address">Street address</label>
                <input
                  id="address"
                  type="text"
                  autoComplete="street-address"
                  placeholder="123 Main St, Apt 4"
                  maxLength={120}
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>

              <div className="edit-field edit-field-wide">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  maxLength={60}
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                />
              </div>

              <div className="edit-field">
                <label htmlFor="state">State</label>
                <select
                  id="state"
                  autoComplete="address-level1"
                  value={form.state}
                  onChange={(e) => updateField('state', e.target.value)}
                >
                  <option value="">Select a state</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div className={`edit-field ${visibleError('zipCode') ? 'has-error' : ''}`}>
                <label htmlFor="zipCode">ZIP code</label>
                <input
                  id="zipCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="78701"
                  maxLength={ZIP_LENGTH}
                  value={form.zipCode}
                  onChange={(e) => updateField('zipCode', e.target.value.replace(/\D/g, '').slice(0, ZIP_LENGTH))}
                  onBlur={() => markTouched('zipCode')}
                  aria-invalid={Boolean(visibleError('zipCode'))}
                  aria-describedby={visibleError('zipCode') ? 'zip-error' : undefined}
                />
                {visibleError('zipCode') && (
                  <p id="zip-error" className="edit-field-error">{visibleError('zipCode')}</p>
                )}
              </div>
            </div>
          </section>

          <div className="edit-profile-footer">
            <div className="edit-profile-feedback" role="status" aria-live="polite">
              {error && <p className="edit-profile-status edit-profile-status-error">{error}</p>}
              {message && <p className="edit-profile-status edit-profile-status-success">{message}</p>}
            </div>

            <div className="edit-profile-actions">
              <button type="button" className="ed-btn ed-btn-outline" onClick={() => navigate('/profile')}>
                Cancel
              </button>
              <button type="submit" className="ed-btn ed-btn-solid" disabled={saving || uploadingPhoto}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
