import { useEffect } from 'react';
import './AccountMenu.css';

interface AccountMenuProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

interface AccountMenuProps {
  open: boolean;
  profile: AccountMenuProfile | null;
  initials: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

interface MenuItem {
  label: string;
  /** Leave undefined for pages that aren't built yet; they render disabled. */
  path?: string;
}

const menuItems: MenuItem[] = [
  { label: 'Profile', path: '/profile' },
  { label: 'Order history' },
  { label: 'My listings', path: '/my-listings' },
  { label: 'Manage drafts' },
  { label: 'Manage reviews' },
];

/** Account panel that drops down from the top when the navbar avatar is clicked. */
function AccountMenu({ open, profile, initials, onClose, onNavigate, onLogout }: AccountMenuProps) {
  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');

  return (
    <div className="account-overlay" onMouseDown={onClose}>
      <aside
        className="account-menu"
        aria-label="Account menu"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="account-header">
          <div className="account-avatar" aria-hidden="true">
            {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials}
          </div>
          <div className="account-identity">
            <span className="account-name">{fullName || 'Your account'}</span>
            {profile && <span className="account-email">{profile.email}</span>}
          </div>
          <button className="account-close" type="button" aria-label="Close account menu" onClick={onClose}>
            ×
          </button>
        </header>

        <nav className="account-links">
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className="account-link"
              disabled={!item.path}
              onClick={() => item.path && onNavigate(item.path)}
            >
              <span>{item.label}</span>
              {item.path ? (
                <span className="account-link-arrow" aria-hidden="true">›</span>
              ) : (
                <span className="account-link-soon">Coming soon</span>
              )}
            </button>
          ))}
        </nav>

        <footer className="account-footer">
          <button type="button" className="account-logout" onClick={onLogout}>
            Log out
          </button>
        </footer>
      </aside>
    </div>
  );
}

export default AccountMenu;
