import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import OrderProgress from '../components/OrderProgress';
import { useAuth } from '../context/AuthContext';
import './Notifications.css';

interface ApiNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedListingId: number | null;
  relatedOrderId: number | null;
  relatedOrderNumber: string | null;
  relatedOrderStatus: string | null;
  read: boolean;
  createdAt: string;
}

function typeIcon(type: string): string {
  if (type === 'PRICE_DROP') return '🏷️';
  if (type === 'ORDER_PLACED') return '✓';
  if (type === 'SALE_PLACED') return '🛒';
  if (type === 'ORDER_PROCESSING' || type === 'SALE_READY') return '⌛';
  if (type === 'ORDER_SHIPPED' || type === 'SALE_SHIPPED') return '↗';
  if (type === 'ORDER_DELIVERED' || type === 'SALE_DELIVERED') return '⌂';
  if (type === 'ORDER_CANCELLED' || type === 'SALE_CANCELLED') return '×';
  return '🔔';
}

function orderStatusForNotification(type: string): string | null {
  if (type === 'ORDER_PLACED') return 'PLACED';
  if (type === 'SALE_PLACED') return 'PLACED';
  if (type === 'ORDER_PROCESSING' || type === 'SALE_READY') return 'PROCESSING';
  if (type === 'ORDER_SHIPPED' || type === 'SALE_SHIPPED') return 'SHIPPED';
  if (type === 'ORDER_DELIVERED' || type === 'SALE_DELIVERED') return 'DELIVERED';
  if (type === 'ORDER_CANCELLED' || type === 'SALE_CANCELLED') return 'CANCELLED';
  return null;
}

function statusBadge(status: string | null) {
  if (status === 'DELIVERED') return { label: 'Completed', tone: 'complete' };
  if (status === 'SHIPPED') return { label: 'Shipped', tone: 'active' };
  if (status === 'PROCESSING') return { label: 'Processing', tone: 'active' };
  if (status === 'CANCELLED') return { label: 'Cancelled', tone: 'alert' };
  if (status === 'PLACED') return { label: 'New', tone: 'alert' };
  return null;
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

function notificationOrderId(notification: ApiNotification): number | null {
  if (notification.relatedOrderId) return notification.relatedOrderId;
  const parsed = Number(notification.message.match(/Order #(\d+)/i)?.[1] ?? 0);
  return parsed || null;
}

function notificationMessage(notification: ApiNotification): string {
  if (!notification.relatedOrderNumber) return notification.message;
  return notification.message.replace(/Order #\d+/i, `Order #${notification.relatedOrderNumber}`);
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
  const location = useLocation();
  const [activeAudience, setActiveAudience] = useState<'all' | 'purchases' | 'sales'>('all');
  const { isAuthenticated } = useAuth();
  const previousOpenRef = useRef(open);

  useEffect(() => {
    if (location.pathname.startsWith('/sales')) setActiveAudience('sales');
    else if (location.pathname.startsWith('/purchases')) setActiveAudience('purchases');
  }, [location.pathname]);

  const refreshNotifications = useCallback((showLoading = false) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setStatus('ready');
      return;
    }
    if (showLoading) setStatus('loading');
    api
      .get<ApiNotification[]>('/notifications')
      .then((res) => {
        setNotifications(res.data);
        setStatus('ready');
      })
      .catch((error) => {
        console.error('Could not load notifications:', error);
        if (showLoading) setStatus('error');
      });
  }, [isAuthenticated]);

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

    refreshNotifications(status === 'loading');
  }, [open, isAuthenticated, refreshNotifications]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const refresh = () => refreshNotifications(false);
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener('chasel:notifications-changed', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('chasel:notifications-changed', refresh);
    };
  }, [isAuthenticated, refreshNotifications]);

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
    const orderId = notificationOrderId(notification);

    onClose();
    if (notification.type.startsWith('SALE_') && orderId) {
      navigate(`/sales?orderId=${orderId}`);
    } else if (notification.type.startsWith('ORDER_') && orderId) {
      navigate(`/purchases?orderId=${orderId}`);
    } else if (notification.relatedListingId) {
      navigate(`/items/${notification.relatedListingId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadSalesCount = notifications.filter(
    (notification) => !notification.read && notification.type.startsWith('SALE_')
  ).length;
  const unreadPurchasesCount = notifications.filter(
    (notification) => !notification.read && notification.type.startsWith('ORDER_')
  ).length;
  const visibleNotifications = notifications.filter((notification) => {
    if (activeAudience === 'sales') return notification.type.startsWith('SALE_');
    if (activeAudience === 'purchases') return notification.type.startsWith('ORDER_');
    return true;
  });
  const displayedNotifications = visibleNotifications.filter((notification, index, list) => (
    notificationOrderId(notification) === null
    || list.findIndex((candidate) => (
      notificationOrderId(candidate) === notificationOrderId(notification)
      && candidate.relatedListingId === notification.relatedListingId
    )) === index
  ));

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

      <div className="notifications-audience-tabs" role="tablist" aria-label="Notification category">
        {(['sales', 'purchases', 'all'] as const).map((audience) => (
          <button
            key={audience}
            type="button"
            role="tab"
            aria-selected={activeAudience === audience}
            className={activeAudience === audience ? 'is-active' : ''}
            onClick={() => setActiveAudience(audience)}
          >
            <span>{audience === 'sales' ? 'Sales' : audience === 'purchases' ? 'Purchases' : 'All'}</span>
            {(
              (audience === 'sales' && unreadSalesCount > 0)
              || (audience === 'purchases' && unreadPurchasesCount > 0)
              || (audience === 'all' && unreadCount > 0)
            ) && <i className="notification-tab-dot" aria-label="New notifications" />}
          </button>
        ))}
      </div>

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
        ) : displayedNotifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">🔔</div>
            <p>You're all caught up.</p>
          </div>
        ) : (
          displayedNotifications.map((notification) => {
            const orderStatus = notification.relatedOrderStatus
              ?? orderStatusForNotification(notification.type);
            const badge = statusBadge(orderStatus);
            return (
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
                  <div className="notification-title-with-status">
                    <h3>{notification.title}</h3>
                    {badge && <span className={`notification-status status-${badge.tone}`}>{badge.label}</span>}
                  </div>
                  <span className="notification-time">{formatRelativeTime(notification.createdAt)}</span>
                </div>
                <p>{notificationMessage(notification)}</p>
                {orderStatus && <OrderProgress status={orderStatus} compact />}
              </div>

              {!notification.read && <span className="unread-dot" />}
            </article>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Notifications;
