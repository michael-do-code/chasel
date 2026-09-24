import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import './Purchases.css';

interface OrderItem {
  id: number;
  listingId: number;
  sellerId: number;
  sellerName: string;
  title: string;
  price: number;
  quantity: number;
  status: string;
  imageUrls: string[];
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
}

function Purchases() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const placedOrderId = (location.state as { placedOrderId?: number } | null)?.placedOrderId;

  useEffect(() => {
    api.get<Order[]>('/orders/my-purchases')
      .then((response) => setOrders(response.data))
      .catch((loadError) => {
        console.error('Failed to load purchases:', loadError);
        setError('Could not load your purchases.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="purchases-page">
      <header className="purchases-header">
        <span>YOUR ACCOUNT</span>
        <h1>Purchases</h1>
        <p>Track your orders and the individual pieces inside each purchase.</p>
      </header>

      {placedOrderId && (
        <div className="order-success" role="status">
          Order #{placedOrderId} was placed successfully.
        </div>
      )}

      {loading && <p className="purchases-status">Loading purchases…</p>}
      {error && <p className="purchases-status purchases-error">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <section className="purchases-empty">
          <span>□</span>
          <h2>No purchases yet</h2>
          <p>Your completed checkouts will appear here.</p>
        </section>
      )}

      <section className="orders-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <header className="order-card-header">
              <div>
                <span>ORDER #{order.id}</span>
                <h2>{new Date(order.createdAt).toLocaleDateString()}</h2>
              </div>
              <strong>{order.status.replaceAll('_', ' ')}</strong>
            </header>

            <div className="order-items">
              {order.items.map((item) => (
                <div className="purchase-item" key={item.id}>
                  <div className="purchase-image">
                    {item.imageUrls?.[0]
                      ? <img src={item.imageUrls[0]} alt={item.title} />
                      : <span>No image</span>}
                  </div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>Sold by {item.sellerName}</p>
                    <small>{item.status.replaceAll('_', ' ')}</small>
                  </div>
                  <strong>${Number(item.price).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <footer className="order-card-footer">
              <div>
                <span>Ship to</span>
                <p>{order.shippingAddress}</p>
              </div>
              <div className="order-total">
                <span>Total</span>
                <strong>${Number(order.totalAmount).toFixed(2)}</strong>
              </div>
            </footer>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Purchases;
