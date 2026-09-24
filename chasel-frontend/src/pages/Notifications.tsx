import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Notifications.css';

interface ApiNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedListingId: number | null;
  read: boolean;
  createdAt: string;
}

function typeIcon(type: string): string {
  if (type === 'PRICE_DROP') return '🏷️';
  return '🔔';
}

function formatRelativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

interface NotificationsProps {
  open: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

function Notifications({ open, onClose, onUnreadCountChange }: NotificationsProps) {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const previousOpenRef = useRef(open);

  // Fires on mount (so the bell badge is right without opening the
  // dropdown) and again every time the dropdown opens, since there's no
  // live push — reopening is how a new notification actually shows up.
  // Guarded on auth since Navbar renders this unconditionally, even for
  // signed-out visitors (mirrors the same guard on the navbar's own
  // profile fetch).
  useEffect(() => {
    if (!isAuthenticated) return;

    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = open;

    // Skip refetching on the closing transition — it can race an
    // in-flight mark-as-read PATCH and stomp the optimistic update.
    if (wasOpen && !open) return;

    setStatus('loading');
    api
      .get<ApiNotification[]>('/notifications')
      .then((res) => {
        setNotifications(res.data);
        setStatus('ready');
      })
      .catch((error) => {
        console.error('Could not load notifications:', error);
        setStatus('error');
      });
  }, [open, isAuthenticated]);

  useEffect(() => {
    onUnreadCountChange(notifications.filter((n) => !n.read).length);
  }, [notifications, onUnreadCountChange]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  const markAsRead = (id: number) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    api.patch(`/notifications/${id}/read`).catch((error) => {
      console.error('Could not mark notification as read:', error);
    });
  };

  const markAllAsRead = () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    api.patch('/notifications/read-all').catch((error) => {
      console.error('Could not mark notifications as read:', error);
    });
  };

  const openNotification = (notification: ApiNotification) => {
    markAsRead(notification.id);
    if (notification.relatedListingId) {
      onClose();
      navigate(`/items/${notification.relatedListingId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!open) return null;

  return (
    <div className="notifications-dropdown" aria-label="Notifications">
      <header className="notifications-dropdown-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <button type="button" className="mark-all-btn" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </header>

      <div className="notifications-dropdown-list">
        {status === 'loading' ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">🔔</div>
            <p>Loading…</p>
          </div>
        ) : status === 'error' ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">🔔</div>
            <p>Couldn't load notifications. Try again.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">🔔</div>
            <p>You're all caught up.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-card ${notification.read ? '' : 'unread'}`}
              onClick={() => openNotification(notification)}
            >
              <div className="notification-icon notification-icon-general">
                {typeIcon(notification.type)}
              </div>

              <div className="notification-body">
                <div className="notification-title-row">
                  <h3>{notification.title}</h3>
                  <span className="notification-time">{formatRelativeTime(notification.createdAt)}</span>
                </div>
                <p>{notification.message}</p>
              </div>

              {!notification.read && <span className="unread-dot" />}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;
