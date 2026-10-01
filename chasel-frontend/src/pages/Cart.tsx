import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import {
  getCuratedCart,
  removeCuratedListingFromCart,
  clearCuratedCart,
} from '../utils/curatedCart';
import CartIcon from '../components/CartIcon';
import './Cart.css';
import { useAuth } from '../context/AuthContext';

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
  startInCheckout?: boolean;
}

const emptyForm = {
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States',
  cardName: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
};

const ESTIMATED_TAX_RATE = 0.10;
const STANDARD_DELIVERY_FEE = 9.95;

function Cart({ open, onClose, startInCheckout = false }: CartProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { refresh: refreshCartCount, removeItem: removeFromCart } = useCart();
  const [view, setView] = useState<'bag' | 'checkout'>('bag');
  const [states, setStates] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'applepay' | 'afterpay'>('card');
  const [saveCard, setSaveCard] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardMessage, setGiftCardMessage] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  async function loadCart() {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.get<CartItem[]>('/cart');
        setItems([...response.data, ...getCuratedCart()]);
      } else {
        setItems(getCuratedCart());
      }
    } catch (error) {
      console.error('Failed to load server cart:', error);
      setItems(getCuratedCart());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    const loadTimer = window.setTimeout(() => {
      setView(startInCheckout ? 'checkout' : 'bag');
      setPaymentMethod('card');
      setSaveCard(false);
      setPromoCode('');
      setPromoMessage('');
      setAppliedPromoCode('');
      setGiftCardCode('');
      setGiftCardMessage('');
      setCheckoutError('');
      void loadCart();
      if (startInCheckout) {
        void startCheckout();
      }
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
  }, [open, onClose, startInCheckout]);

  const removeItem = async (productId: number) => {
    if (!isAuthenticated || productId < 0) {
      removeCuratedListingFromCart(productId);
    } else {
      // Goes through the provider so the navbar badge stays in sync.
      await removeFromCart(productId);
    }
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  async function startCheckout() {
    setView('checkout');
    setCheckoutError('');
    try {
      const statesResponse = await api.get<string[]>('/options/states');
      setStates(statesResponse.data);
      if (isAuthenticated) {
        const profileResponse = await api.get<UserProfile>('/users/me');
        const profile = profileResponse.data;
        setForm((current) => ({
          ...current,
          email: profile.email ?? '',
          phone: profile.phone ?? '',
          firstName: '',
          lastName: '',
          state: profile.location ?? '',
        }));
      }
    } catch (error) {
      console.error('Failed to load checkout details:', error);
      setCheckoutError('Could not load your saved details. You can still enter them below.');
    }
  }

  const goToCheckoutLogin = () => {
    onClose();
    navigate('/login', {
      state: {
        checkout: true,
        returnTo: `${location.pathname}${location.search}`,
      },
    });
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
      `${form.firstName} ${form.lastName}`.trim(),
      form.addressLine1,
      form.addressLine2,
      `${form.city}, ${form.state} ${form.zipCode}`,
      form.country,
      `Phone: ${form.phone}`,
    ].filter(Boolean).join('\n');

    try {
      const receiptEmail = form.email;
      const endpoint = isAuthenticated ? '/orders/checkout' : '/orders/guest-checkout';
      const payload = isAuthenticated
        ? { shippingAddress, promoCode: appliedPromoCode || null }
        : {
            email: form.email,
            phone: form.phone,
            firstName: form.firstName,
            lastName: form.lastName,
            shippingAddress,
            promoCode: appliedPromoCode || null,
            items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          };
      const response = await api.post<{ id: number; orderNumber: string }>(endpoint, payload);
      setItems([]);
      if (!isAuthenticated) clearCuratedCart();
      await refreshCartCount();
      window.dispatchEvent(new Event('chasel:notifications-changed'));
      setForm(emptyForm);
      setSaveCard(false);
      onClose();
      if (isAuthenticated) {
        navigate('/purchases', { state: { placedOrderId: response.data.id, placedOrderNumber: response.data.orderNumber } });
      } else {
        window.alert(`Order #${response.data.orderNumber} was placed. Receipt and updates will be sent to ${receiptEmail}.`);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail ?? error.response?.data?.message
        : null;
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        await loadCart();
        await refreshCartCount();
        setView('bag');
        setCheckoutError(message || 'One of these items is no longer available and was removed from your bag.');
      } else {
        setCheckoutError(message || 'Checkout failed. Please review your information and try again.');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const estimatedTax = Math.round(subtotal * ESTIMATED_TAX_RATE * 100) / 100;
  const hasFreeDelivery = appliedPromoCode === 'FREESHIP';
  const deliveryFee = hasFreeDelivery ? 0 : STANDARD_DELIVERY_FEE;
  const orderTotal = subtotal + estimatedTax + deliveryFee;

  const applyPromoCode = () => {
    const normalized = promoCode.trim().toUpperCase();
    if (normalized === 'FREESHIP') {
      setAppliedPromoCode(normalized);
      setPromoMessage('Free delivery applied.');
    } else {
      setAppliedPromoCode('');
      setPromoMessage('This code is not valid.');
    }
  };

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
                <div className="cart-empty"><span className="cart-empty-icon"><CartIcon /></span><h3>Your bag is empty</h3><p>Add something you love from the collection.</p><button type="button" onClick={onClose}>Continue shopping</button></div>
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
              {checkoutError && <p className="drawer-checkout-error" role="alert">{checkoutError}</p>}
              <div className="cart-total cart-total-subtotal"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="cart-total cart-total-secondary"><span>Estimated tax (10%)</span><span>${estimatedTax.toFixed(2)}</span></div>
              <div className="cart-total cart-total-secondary"><span>Delivery</span><span>TBD at checkout</span></div>
              <div className="cart-total cart-total-grand"><span>Estimated total</span><span>${(subtotal + estimatedTax).toFixed(2)}</span></div>
              <button
                className="checkout-button"
                type="button"
                disabled={items.length === 0}
                onClick={() => isAuthenticated ? void startCheckout() : goToCheckoutLogin()}
              >
                Continue to checkout
              </button>
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
                <div className="drawer-field-row">
                  <label>First name<input required autoComplete="given-name" placeholder="Enter first name" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} /></label>
                  <label>Last name<input required autoComplete="family-name" placeholder="Enter last name" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} /></label>
                </div>
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
                <div className="checkout-section-heading"><h3>Payment</h3><p>Choose how you would like to pay.</p></div>
                <div className="payment-method-grid" role="radiogroup" aria-label="Payment method">
                  <button type="button" role="radio" aria-checked={paymentMethod === 'card'} className={paymentMethod === 'card' ? 'active' : ''} onClick={() => setPaymentMethod('card')}><span className="payment-card-symbol">▰</span><span>Card</span></button>
                  <button type="button" role="radio" aria-checked={paymentMethod === 'paypal'} className={paymentMethod === 'paypal' ? 'active' : ''} onClick={() => setPaymentMethod('paypal')}><span className="payment-paypal-symbol"><b>Pay</b>Pal</span><span>PayPal</span></button>
                  <button type="button" role="radio" aria-checked={paymentMethod === 'applepay'} className={paymentMethod === 'applepay' ? 'active' : ''} onClick={() => setPaymentMethod('applepay')}><span className="payment-apple-symbol">● Pay</span><span>Apple Pay</span></button>
                  <button type="button" role="radio" aria-checked={paymentMethod === 'afterpay'} className={paymentMethod === 'afterpay' ? 'active' : ''} onClick={() => setPaymentMethod('afterpay')}><span className="payment-afterpay-symbol">afterpay</span><span>Afterpay</span></button>
                </div>

                {paymentMethod === 'card' ? (
                  <div className="checkout-payment-card">
                    <div className="checkout-payment-method">
                      <span className="checkout-payment-radio" aria-hidden="true" />
                      <div>
                        <strong>Credit or debit card</strong>
                        <span className="accepted-card-brands" aria-label="Accepted cards">
                          <span className="visa">VISA</span>
                          <span className="mastercard"><i /><i /></span>
                          <span className="amex">AMEX</span>
                          <span className="discover">DISCOVER</span>
                        </span>
                      </div>
                      <span className="checkout-payment-lock" aria-label="Secure payment">SECURE</span>
                    </div>
                    <div className="checkout-payment-fields">
                      <label>Name on card<input required autoComplete="cc-name" placeholder="Enter name as shown on card" value={form.cardName} onChange={(e) => updateField('cardName', e.target.value)} /></label>
                      <label>Card number<input required autoComplete="cc-number" inputMode="numeric" maxLength={19} placeholder="Enter card number" value={form.cardNumber} onChange={(e) => updateField('cardNumber', e.target.value)} /></label>
                      <div className="drawer-field-row">
                        <label>Expiration<input required autoComplete="cc-exp" inputMode="numeric" maxLength={5} placeholder="MM/YY" value={form.cardExpiry} onChange={(e) => updateField('cardExpiry', e.target.value)} /></label>
                        <label>Security code<input required autoComplete="cc-csc" inputMode="numeric" maxLength={4} placeholder="CVC" value={form.cardCvc} onChange={(e) => updateField('cardCvc', e.target.value)} /></label>
                      </div>
                      <label className="save-card-option">
                        <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} />
                        <span><strong>Save card</strong><small>For faster checkout.</small></span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className={`payment-method-panel ${paymentMethod}`}>
                    <strong>{paymentMethod === 'paypal' ? 'PayPal' : paymentMethod === 'applepay' ? 'Apple Pay' : 'Afterpay'}</strong>
                    <p>{paymentMethod === 'paypal'
                      ? 'After placing the order, you would continue to PayPal to approve the payment.'
                      : paymentMethod === 'applepay'
                        ? 'Confirm securely with the cards saved to your Apple Wallet.'
                        : `Pay in 4 interest-free payments of $${(orderTotal / 4).toFixed(2)}.`}</p>
                  </div>
                )}
                <p className="checkout-demo-disclaimer"><strong>Demo payment:</strong> no card details are sent or stored, and no real charge will be made.</p>
              </section>

              <section className="drawer-checkout-section checkout-promo-section">
                <div className="checkout-section-heading"><h3>Discounts &amp; gift cards</h3><p>Apply a code to your order.</p></div>
                <label>Discount code</label>
                <div className="checkout-promo-control">
                  <input aria-label="Promotion or discount code" placeholder="Enter discount code" value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoMessage(''); }} />
                  <button type="button" disabled={!promoCode.trim()} onClick={applyPromoCode}>Apply</button>
                </div>
                {promoMessage && <p className="checkout-promo-message">{promoMessage}</p>}
                <label>Gift card code</label>
                <div className="checkout-promo-control">
                  <input aria-label="Gift card code" placeholder="Enter gift card code" value={giftCardCode} onChange={(e) => { setGiftCardCode(e.target.value.toUpperCase()); setGiftCardMessage(''); }} />
                  <button type="button" disabled={!giftCardCode.trim()} onClick={() => setGiftCardMessage('Gift card ready to verify.')}>Apply</button>
                </div>
                {giftCardMessage && <p className="checkout-promo-message">{giftCardMessage}</p>}
              </section>

              <section className="drawer-order-review checkout-review-card">
                <div className="checkout-review-heading">
                  <div><span>YOUR ORDER</span><h3>Order summary</h3></div>
                  <small>{items.length} {items.length === 1 ? 'item' : 'items'}</small>
                </div>
                {items.map((item) => (
                  <article className="checkout-review-item" key={item.cartItemId}>
                    <div className="checkout-review-image">
                      {item.imageUrls?.[0]
                        ? <img src={item.imageUrls[0]} alt="" />
                        : <span aria-hidden="true">—</span>}
                    </div>
                    <div className="checkout-review-copy">
                      <h4>{item.title}</h4>
                      <p>Qty {item.quantity} · ${item.price.toFixed(2)} each</p>
                    </div>
                    <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                  </article>
                ))}
              </section>
            </div>

            <footer className="cart-summary drawer-checkout-footer">
              <div className="cart-total cart-total-secondary"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="cart-total cart-total-secondary"><span>Estimated tax (10%)</span><span>${estimatedTax.toFixed(2)}</span></div>
              <div className="cart-total cart-total-secondary"><span>Delivery</span><span>{hasFreeDelivery ? 'Free' : `$${deliveryFee.toFixed(2)}`}</span></div>
              <div className="cart-total cart-total-grand"><span>Total</span><span>${orderTotal.toFixed(2)}</span></div>
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
