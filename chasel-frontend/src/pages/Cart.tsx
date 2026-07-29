import { useEffect, useState } from 'react';
import api from '../api/axios';
import './Cart.css';

interface CartItem {
  cartItemId: number;
  productId: number;
  title: string;
  price: number;
  imageUrls: string[];
  quantity: number;
}

interface CartProps {
  open: boolean;
  onClose: () => void;
}

function Cart({ open, onClose }: CartProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCart = async () => {
    setLoading(true);
    try {
      const response = await api.get<CartItem[]>('/cart');
      setItems(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    loadCart();
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, onClose]);

  const removeItem = async (productId: number) => {
    await api.delete(`/cart/items/${productId}`);
    setItems((current) =>
      current.filter((item) => item.productId !== productId)
    );
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  if (!open) return null;

  return (
    <div className="cart-overlay" onMouseDown={onClose}>
      <aside
        className="cart-drawer"
        aria-label="Shopping cart"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cart-header">
          <div>
            <span className="cart-eyebrow">YOUR SELECTION</span>
            <h2>Shopping bag</h2>
          </div>
          <button
            className="cart-close"
            type="button"
            aria-label="Close cart"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="cart-content">
          {loading && <p className="cart-message">Loading your bag…</p>}

          {!loading && items.length === 0 && (
            <div className="cart-empty">
              <span>🛍️</span>
              <h3>Your bag is empty</h3>
              <p>Add something you love from the collection.</p>
              <button type="button" onClick={onClose}>
                Continue shopping
              </button>
            </div>
          )}

          {!loading && items.map((item) => (
            <article className="cart-item" key={item.cartItemId}>
              <div className="cart-item-image">
                {item.imageUrls?.[0] ? (
                  <img src={item.imageUrls[0]} alt={item.title} />
                ) : (
                  <span>No image</span>
                )}
              </div>

              <div className="cart-item-details">
                <h3>{item.title}</h3>
                <p>Quantity: {item.quantity}</p>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                >
                  Remove
                </button>
              </div>

              <strong>${item.price.toFixed(2)}</strong>
            </article>
          ))}
        </div>

        <footer className="cart-summary">
          <div>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div>
            <span>Estimated tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="cart-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            className="checkout-button"
            type="button"
            disabled={items.length === 0}
          >
            Checkout
          </button>
        </footer>
      </aside>
    </div>
  );
}

export default Cart;
