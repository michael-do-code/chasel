import { useState } from 'react';
import './Notifications.css';

type NotificationType = 'order' | 'rating' | 'general';

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: 'order',
    title: 'Order shipped',
    message: 'Your order for "Raw Silk Overshirt" has shipped and is on its way.',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 2,
    type: 'rating',
    title: 'New review',
    message: 'Amelia R. left you a 5★ review on "Heavy Wool Trouser".',
    time: '5 hours ago',
    read: false,
  },
  {
    id: 3,
    type: 'order',
    title: 'Order delivered',
    message: 'Your order for "Archive Chelsea Boot 02" was delivered.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: 4,
    type: 'general',
    title: 'Listing approved',
    message: 'Your listing "Cashmere Blend Sweater" was approved and is now live.',
    time: '2 days ago',
    read: true,
  },
  {
    id: 5,
    type: 'rating',
    title: 'New review',
    message: 'Marcus T. left you a 4★ review on "Archive Chelsea Boot 02".',
    time: '3 days ago',
    read: true,
  },
  {
    id: 6,
    type: 'order',
    title: 'Order placed',
    message: 'Your order for "Leather Crossbody Bag" was placed successfully.',
    time: '4 days ago',
    read: true,
  },
  {
    id: 7,
    type: 'general',
    title: 'Price drop',
    message: 'An item on your wishlist, "Silk Scarves Set", dropped in price.',
    time: '5 days ago',
    read: true,
  },
];

const filters: { label: string; value: 'all' | NotificationType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Orders', value: 'order' },
  { label: 'Reviews', value: 'rating' },
  { label: 'Other', value: 'general' },
];

function typeIcon(type: NotificationType): string {
  if (type === 'order') return '📦';
  if (type === 'rating') return '★';
  return '🔔';
}

function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');

  const markAsRead = (id: number) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
  };

  const visibleNotifications = notifications.filter(
    (n) => activeFilter === 'all' || n.type === activeFilter
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <div>
          <span>YOUR ACTIVITY</span>
          <h1>Notifications</h1>
          <p>Order updates, reviews, and everything else in one place.</p>
        </div>

        {unreadCount > 0 && (
          <button type="button" className="mark-all-btn" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </header>

      <div className="notifications-filters">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`filter-btn ${activeFilter === filter.value ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {visibleNotifications.length === 0 ? (
        <section className="notifications-empty">
          <div className="notifications-empty-icon">🔔</div>
          <h2>Nothing here</h2>
          <p>You're all caught up.</p>
        </section>
      ) : (
        <section className="notifications-list">
          {visibleNotifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-card ${notification.read ? '' : 'unread'}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className={`notification-icon notification-icon-${notification.type}`}>
                {typeIcon(notification.type)}
              </div>

              <div className="notification-body">
                <div className="notification-title-row">
                  <h2>{notification.title}</h2>
                  <span className="notification-time">{notification.time}</span>
                </div>
                <p>{notification.message}</p>
              </div>

              {!notification.read && <span className="unread-dot" />}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default Notifications;
