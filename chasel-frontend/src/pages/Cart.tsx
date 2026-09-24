import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import {
  getCuratedCart,
  removeCuratedListingFromCart,
} from '../utils/curatedCart';
import './Cart.css';

interface CartItem {
  cartItemId: number;
  productId: number;
  title: string;
  price: number;
  imageUrls: string[];
  quantity: number;
}

interface UserProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  location: string | null;
}

interface CartProps {
  open: boolean;
  onClose: () => void;
}

const emptyForm = {
  email: '',
  phone: '',
  fullName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States',
};

function Cart({ open, onClose }: CartProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { removeItem: removeFromCart } = useCart();
  const [view, setView] = useState<'bag' | 'checkout'>('bag');
  const [states, setStates] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const navigate = useNavigate();

  const loadCart = async () => {
    setLoading(true);
    try {
      const response = await api.get<CartItem[]>('/cart');
      setItems([...response.data, ...getCuratedCart()]);
    } catch (error) {
      console.error('Failed to load server cart:', error);
      setItems(getCuratedCart());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    const loadTimer = window.setTimeout(() => {
      setView('bag');
      setCheckoutError('');
      void loadCart();
    }, 0);
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.clearTimeout(loadTimer);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, onClose]);

  const removeItem = async (productId: number) => {
    if (productId < 0) {
      removeCuratedListingFromCart(productId);
    } else {
      // Goes through the provider so the navbar badge stays in sync.
      await removeFromCart(productId);
    }
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  const startCheckout = async () => {
    setView('checkout');
    setCheckoutError('');
    try {
      const [profileResponse, statesResponse] = await Promise.all([
        api.get<UserProfile>('/users/me'),
        api.get<string[]>('/options/states'),
      ]);
      const profile = profileResponse.data;
      setStates(statesResponse.data);
      setForm((current) => ({
        ...current,
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        fullName: [profile.firstName, profile.lastName].filter(Boolean).join(' '),
        state: profile.location ?? '',
      }));
    } catch (error) {
      console.error('Failed to load checkout details:', error);
      setCheckoutError('Could not load your saved details. You can still enter them below.');
    }
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCheckoutSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCheckoutError('');

    if (items.some((item) => item.productId < 0)) {
      setCheckoutError('Preview items cannot be purchased. Go back and remove them first.');
      return;
    }

    setCheckoutLoading(true);
    const shippingAddress = [
      form.fullName,
      form.addressLine1,
      form.addressLine2,
      `${form.city}, ${form.state} ${form.zipCode}`,
      form.country,
      `Phone: ${form.phone}`,
    ].filter(Boolean).join('\n');

    try {
      const response = await api.post<{ id: number }>('/orders/checkout', { shippingAddress });
      setItems([]);
      setForm(emptyForm);
      onClose();
      navigate('/purchases', { state: { placedOrderId: response.data.id } });
    } catch (error) {
      console.error('Checkout failed:', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail ?? error.response?.data?.message
        : null;
      setCheckoutError(message || 'Checkout failed. Please review your information and try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  if (!open) return null;

  return (
    <div className="cart-overlay" onMouseDown={onClose}>
      <aside className="cart-drawer" aria-label="Shopping cart" onMouseDown={(event) => event.stopPropagation()}>
        {view === 'bag' ? (
          <>
            <header className="cart-header">
              <div><span className="cart-eyebrow">YOUR SELECTION</span><h2>Shopping bag</h2></div>
              <button className="cart-close" type="button" aria-label="Close cart" onClick={onClose}>×</button>
            </header>

            <div className="cart-content">
              {loading && <p className="cart-message">Loading your bag…</p>}
              {!loading && items.length === 0 && (
                <div className="cart-empty"><span>🛍️</span><h3>Your bag is empty</h3><p>Add something you love from the collection.</p><button type="button" onClick={onClose}>Continue shopping</button></div>
              )}
              {!loading && items.map((item) => (
                <article className="cart-item" key={item.cartItemId}>
                  <div className="cart-item-image">{item.imageUrls?.[0] ? <img src={item.imageUrls[0]} alt={item.title} /> : <span>No image</span>}</div>
                  <div className="cart-item-details"><h3>{item.title}</h3><p>Quantity: {item.quantity}</p><button type="button" onClick={() => removeItem(item.productId)}>Remove</button></div>
                  <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                </article>
              ))}
            </div>

            <footer className="cart-summary">
              <div className="cart-total"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <button className="checkout-button" type="button" disabled={items.length === 0} onClick={startCheckout}>Continue to checkout</button>
            </footer>
          </>
        ) : (
          <form className="drawer-checkout" onSubmit={handleCheckoutSubmit}>
            <header className="cart-header checkout-drawer-header">
              <button className="checkout-back" type="button" onClick={() => { setView('bag'); setCheckoutError(''); }}>← Back</button>
              <div><span className="cart-eyebrow">SECURE CHECKOUT</span><h2>Checkout</h2></div>
              <button className="cart-close" type="button" aria-label="Close checkout" onClick={onClose}>×</button>
            </header>

            <div className="drawer-checkout-content">
              <section className="drawer-checkout-section">
                <div className="checkout-section-heading"><h3>Contact information</h3><p>For your receipt and delivery updates.</p></div>
                <label>Email address<input type="email" required autoFocus placeholder="you@example.com" value={form.email} onChange={(e) => updateField('email', e.target.value)} /></label>
                <label>Phone number<input type="tel" required placeholder="(555) 123-4567" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} /></label>
              </section>

              <section className="drawer-checkout-section">
                <div className="checkout-section-heading"><h3>Shipping address</h3><p>Where your order should be delivered.</p></div>
                <label>Recipient name<input required placeholder="Full name" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} /></label>
                <label>Street address<input required placeholder="House number and street name" value={form.addressLine1} onChange={(e) => updateField('addressLine1', e.target.value)} /></label>
                <label>Apartment, suite, unit <small>optional</small><input placeholder="Apt, suite, or unit" value={form.addressLine2} onChange={(e) => updateField('addressLine2', e.target.value)} /></label>
                <label>City<input required placeholder="City" value={form.city} onChange={(e) => updateField('city', e.target.value)} /></label>
                <div className="drawer-field-row">
                  <label>State<select required value={form.state} onChange={(e) => updateField('state', e.target.value)}><option value="">Select state</option>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select></label>
                  <label>ZIP code<input required inputMode="numeric" placeholder="ZIP code" value={form.zipCode} onChange={(e) => updateField('zipCode', e.target.value)} /></label>
                </div>
                <label>Country<input required value={form.country} onChange={(e) => updateField('country', e.target.value)} /></label>
              </section>

              <section className="drawer-checkout-section">
                <div className="checkout-section-heading"><h3>Payment</h3><p>Payment setup for this project.</p></div>
                <div className="drawer-payment-note"><strong>Demo checkout</strong><p>No real payment will be collected. Connect a payment provider before launch.</p></div>
              </section>

              <section className="drawer-order-review checkout-review-card">
                <h3>Order summary</h3>
                {items.map((item) => (
                  <div key={item.cartItemId}><span>{item.title}<small>Quantity {item.quantity}</small></span><strong>${(item.price * item.quantity).toFixed(2)}</strong></div>
                ))}
              </section>
            </div>

            <footer className="cart-summary drawer-checkout-footer">
              <div className="cart-total"><span>Total</span><span>${subtotal.toFixed(2)}</span></div>
              {checkoutError && <p className="drawer-checkout-error" role="alert">{checkoutError}</p>}
              <button className="checkout-button" type="submit" disabled={checkoutLoading}>
                {checkoutLoading ? 'Placing order…' : 'Place order'}
              </button>
            </footer>
          </form>
        )}
      </aside>
    </div>
  );
}

export default Cart;
