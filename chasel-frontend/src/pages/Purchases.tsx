import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import OrderProgress from '../components/OrderProgress';
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
  returnStatus: string | null;
  returnAddress: string;
  returnReason: string | null;
  returnDetails: string | null;
  returnPreferredResolution: string | null;
  returnMediaUrls: string[];
  returnSellerNote: string | null;
  returnAuthorizationCode: string | null;
  imageUrls: string[];
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
  cancelUntil: string | null;
  cancelledAt: string | null;
  cancellable: boolean;
  items: OrderItem[];
}

function cancellationTimeLeft(cancelUntil: string | null, now: number) {
  if (!cancelUntil) return null;

  const milliseconds = new Date(cancelUntil).getTime() - now;
  if (milliseconds <= 0) return null;

  const totalSeconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : `${minutes}m ${seconds}s`;
}

function Purchases() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [returnOrderId, setReturnOrderId] = useState<number | null>(null);
  const [returnItemIds, setReturnItemIds] = useState<number[]>([]);
  const [returnReason, setReturnReason] = useState('Changed my mind');
  const [returnDetails, setReturnDetails] = useState('');
  const [returnResolution, setReturnResolution] = useState('Refund to original payment method');
  const [returnFiles, setReturnFiles] = useState<File[]>([]);
  const [returnStep, setReturnStep] = useState(1);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [printingReturnItemId, setPrintingReturnItemId] = useState<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const placedOrderState = location.state as { placedOrderId?: number; placedOrderNumber?: string } | null;
  const placedOrderId = placedOrderState?.placedOrderId;
  const placedOrderNumber = placedOrderState?.placedOrderNumber;
  const linkedOrderId = Number(searchParams.get('orderId')) || null;

  useEffect(() => {
    if (linkedOrderId) setExpandedOrderId(linkedOrderId);
  }, [linkedOrderId]);

  useEffect(() => {
    api.get<Order[]>('/orders/my-purchases')
      .then((response) => setOrders(response.data))
      .catch((loadError) => {
        console.error('Failed to load purchases:', loadError);
        setError('Could not load your purchases.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const done = () => setPrintingReturnItemId(null);
    window.addEventListener('afterprint', done);
    return () => window.removeEventListener('afterprint', done);
  }, []);

  const printReturnLabel = (itemId: number) => {
    setPrintingReturnItemId(itemId);
    window.setTimeout(() => window.print(), 0);
  };

  useEffect(() => {
    const refresh = window.setInterval(() => {
      api.get<Order[]>('/orders/my-purchases')
        .then((response) => setOrders(response.data))
        .catch((refreshError) => console.error('Failed to refresh purchases:', refreshError));
    }, 15000);
    return () => window.clearInterval(refresh);
  }, []);

  const cancelOrder = async (order: Order) => {
    const confirmed = window.confirm(
      `Cancel order #${order.orderNumber}? The items will be returned to the marketplace.`
    );
    if (!confirmed) return;

    setCancellingOrderId(order.id);
    setCancelError('');
    try {
      const response = await api.post<Order>(`/orders/${order.id}/cancel`);
      setOrders((current) => current.map((item) =>
        item.id === order.id ? response.data : item
      ));
      window.dispatchEvent(new Event('chasel:notifications-changed'));
    } catch (cancelRequestError) {
      console.error('Failed to cancel order:', cancelRequestError);
      setCancelError('This order could not be cancelled. Its cancellation period may have ended.');
      const refreshed = await api.get<Order[]>('/orders/my-purchases');
      setOrders(refreshed.data);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const submitReturn = async (order: Order) => {
    if (returnItemIds.length === 0) {
      setCancelError('Select at least one item to return.');
      return;
    }
    setReturnSubmitting(true);
    setCancelError('');
    try {
      let mediaUrls: string[] = [];
      if (returnFiles.length) {
        const form = new FormData();
        returnFiles.forEach((file) => form.append('files', file));
        const upload = await api.post<string[]>('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        mediaUrls = upload.data;
      }
      const response = await api.post<Order>(`/orders/${order.id}/returns`, {
        itemIds: returnItemIds,
        reason: returnReason,
        details: returnDetails,
        preferredResolution: returnResolution,
        mediaUrls,
      });
      setOrders((current) => current.map((entry) => entry.id === order.id ? response.data : entry));
      setReturnOrderId(null);
      setReturnItemIds([]);
      setReturnFiles([]);
      setReturnDetails('');
      setReturnStep(1);
      window.dispatchEvent(new Event('chasel:notifications-changed'));
    } catch (returnError) {
      console.error('Failed to request return:', returnError);
      setCancelError('The return request could not be created. Check your files and try again.');
    } finally {
      setReturnSubmitting(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="purchases-page">
      <header className="purchases-header">
        <div className="purchases-header-copy">
          <span>YOUR ACCOUNT · ORDER ARCHIVE</span>
          <h1>Purchases</h1>
          <p>Follow every piece from checkout to delivery, all in one place.</p>
        </div>
        <div className="purchases-count" aria-label={`${orders.length} orders`}>
          <span>TOTAL ORDERS</span>
          <strong>{String(orders.length).padStart(2, '0')}</strong>
        </div>
      </header>

      {placedOrderId && (
        <div className="order-success" role="status">
          Order #{placedOrderNumber ?? placedOrderId} was placed successfully.
        </div>
      )}

      {loading && <p className="purchases-status">Loading purchases…</p>}
      {error && <p className="purchases-status purchases-error">{error}</p>}
      {cancelError && <p className="purchases-status purchases-error">{cancelError}</p>}

      {!loading && !error && orders.length === 0 && (
        <section className="purchases-empty">
          <span>□</span>
          <h2>No purchases yet</h2>
          <p>Your completed checkouts will appear here.</p>
        </section>
      )}

      <section className="orders-list">
        {orders.map((order) => {
          const timeLeft = cancellationTimeLeft(order.cancelUntil, now);
          const cancellationOpen = order.cancellable && timeLeft !== null;

          const expanded = expandedOrderId === order.id;
          const visibleItems = order.items.slice(0, 6);
          const hiddenItemCount = Math.max(0, order.items.length - visibleItems.length);
          const returnableItems = order.items.filter((item) => item.status === 'DELIVERED' && !item.returnStatus);
          const selectedReturnItems = order.items.filter((item) => returnItemIds.includes(item.id));
          const returnGroups = Object.values(selectedReturnItems.reduce<Record<number, {
            sellerId: number;
            sellerName: string;
            returnAddress: string;
            items: OrderItem[];
          }>>((groups, item) => {
            groups[item.sellerId] ??= {
              sellerId: item.sellerId,
              sellerName: item.sellerName,
              returnAddress: item.returnAddress,
              items: [],
            };
            groups[item.sellerId].items.push(item);
            return groups;
          }, {}));

          return (
          <article className={`order-card ${expanded ? 'is-expanded' : ''}`} key={order.id}>
            <button
              type="button"
              className="order-summary-row"
              aria-expanded={expanded}
              aria-controls={`order-details-${order.id}`}
              onClick={() => setExpandedOrderId(expanded ? null : order.id)}
            >
              <div className="order-summary-identity">
                <span>ORDER #{order.orderNumber}</span>
                <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
              </div>

              <div className="order-summary-products" aria-label={`${order.items.length} items`}>
                <div className="order-summary-thumbnails">
                  {visibleItems.map((item) => (
                    <span className="order-summary-thumbnail" key={item.id} title={item.title}>
                      {item.imageUrls?.[0]
                        ? <img src={item.imageUrls[0]} alt="" />
                        : <span>{item.title.slice(0, 1)}</span>}
                    </span>
                  ))}
                  {hiddenItemCount > 0 && (
                    <span className="order-summary-more" aria-label={`${hiddenItemCount} more items`}>…</span>
                  )}
                </div>
                <span className="order-summary-names">
                  {order.items.map((item) => item.title).join(', ')}
                </span>
              </div>

              <span className={`order-summary-status status-${order.status.toLowerCase()}`}>
                {order.status.replaceAll('_', ' ')}
              </span>
              <span className="order-summary-chevron" aria-hidden="true">{expanded ? '−' : '+'}</span>
            </button>

            {expanded && (
            <div className="order-details" id={`order-details-${order.id}`}>

            {order.status === 'PLACED' && order.cancelUntil && (
              <div className={`cancellation-window ${cancellationOpen ? 'is-open' : 'is-closed'}`}>
                {cancellationOpen ? (
                  <>
                    <div>
                      <strong>Order confirmed · Cancellation window open</strong>
                      <span>You can cancel this order for another {timeLeft}.</span>
                    </div>
                    <button
                      className="cancel-order-button"
                      type="button"
                      disabled={cancellingOrderId === order.id}
                      onClick={() => cancelOrder(order)}
                    >
                      {cancellingOrderId === order.id ? 'Cancelling…' : 'Cancel order'}
                    </button>
                  </>
                ) : (
                  <>
                    <strong>Cancellation window ended</strong>
                    <span>This order is now being prepared for the seller.</span>
                  </>
                )}
              </div>
            )}

            {order.status === 'CANCELLED' && (
              <div className="cancellation-window is-cancelled">
                <strong>Order cancelled</strong>
                <span>The items have been returned to the marketplace.</span>
              </div>
            )}

            {order.status === 'SHIPPED' && (
              <div className="delivery-confirmation">
                <div>
                  <strong>Your order is on the way</strong>
                  <span>Delivery will be confirmed automatically by the shipping carrier.</span>
                </div>
              </div>
            )}

            {returnableItems.length > 0 && returnOrderId !== order.id && (
              <div className="return-order-action">
                <div><strong>Need to return something?</strong><span>Select only the items you want to send back.</span></div>
                <button type="button" onClick={() => { setReturnOrderId(order.id); setReturnItemIds([]); setReturnStep(1); }}>
                  Start a return
                </button>
              </div>
            )}

            {returnOrderId === order.id && (
              <section className="return-builder">
                <header><div><span>RETURN CENTER</span><h3>Start a return</h3></div><button type="button" onClick={() => setReturnOrderId(null)}>Close</button></header>
                <nav className="return-steps" aria-label="Return steps">{['Items', 'Reason', 'Evidence', 'Review'].map((label, index) => <span className={returnStep >= index + 1 ? 'active' : ''} key={label}><b>{index + 1}</b>{label}</span>)}</nav>

                {returnStep === 1 && <div className="return-step-panel"><h4>Which items are you returning?</h4><p>Choose one or more items. Products from the same seller will be packed together.</p><div className="return-product-grid">{returnableItems.map((item) => <label className={`return-product ${returnItemIds.includes(item.id) ? 'selected' : ''}`} key={item.id}><input type="checkbox" checked={returnItemIds.includes(item.id)} onChange={() => setReturnItemIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}/>{item.imageUrls?.[0] && <img src={item.imageUrls[0]} alt=""/>}<span><strong>{item.title}</strong><small>Sold by {item.sellerName}</small></span><i>{returnItemIds.includes(item.id) ? '✓' : ''}</i></label>)}</div></div>}

                {returnStep === 2 && <div className="return-step-panel"><h4>Tell us what happened</h4><p>This information helps the seller review your request.</p><label className="return-field">Why do you want to return it?<select value={returnReason} onChange={(event) => setReturnReason(event.target.value)}><option>Changed my mind</option><option>Item not as described</option><option>Item arrived damaged</option><option>Wrong item received</option><option>Item does not fit</option><option>Missing parts or accessories</option><option>Quality was not as expected</option><option>Other</option></select></label><label className="return-field">What would you like?<select value={returnResolution} onChange={(event) => setReturnResolution(event.target.value)}><option>Refund to original payment method</option><option>Replacement, if available</option><option>Store credit</option></select></label><label className="return-field">Add details<textarea maxLength={1500} value={returnDetails} onChange={(event) => setReturnDetails(event.target.value)} placeholder="Describe the condition, issue, missing pieces, or anything the seller should know."/><small>{returnDetails.length}/1500</small></label></div>}

                {returnStep === 3 && <div className="return-step-panel"><h4>Add photos or a short video</h4><p>Recommended for damaged, incorrect, or not-as-described items. Up to 5 files, 25 MB each.</p><label className="return-upload"><input type="file" accept="image/*,video/*" multiple onChange={(event) => setReturnFiles(Array.from(event.target.files || []).slice(0, 5))}/><b>＋</b><strong>Choose photos or video</strong><span>JPG, PNG, HEIC, MP4 or MOV</span></label>{returnFiles.length > 0 && <div className="return-file-list">{returnFiles.map((file, index) => <span key={`${file.name}-${index}`}>{file.type.startsWith('video/') ? '▶' : '▧'} {file.name}<button type="button" onClick={() => setReturnFiles((files) => files.filter((_, i) => i !== index))}>×</button></span>)}</div>}</div>}

                {returnStep === 4 && <div className="return-step-panel"><h4>Review your return</h4><p>The seller will be notified as soon as you submit.</p><div className="return-review-summary"><span><small>Reason</small><strong>{returnReason}</strong></span><span><small>Requested outcome</small><strong>{returnResolution}</strong></span><span><small>Evidence</small><strong>{returnFiles.length ? `${returnFiles.length} file(s)` : 'No files added'}</strong></span></div><div className="return-groups">{returnGroups.map((group) => <article key={group.sellerId}><span>PACKAGE FOR {group.sellerName.toUpperCase()}</span><strong>{group.items.map((item) => item.title).join(', ')}</strong><p>{group.items.length} {group.items.length === 1 ? 'item' : 'items'} · Return together after approval</p><small>The return address and label appear after the seller approves.</small></article>)}</div><div className="return-after-submit"><b>What happens next?</b><span>1. Seller reviews your request</span><span>2. They can approve it or message you first</span><span>3. After approval, your return label appears here</span></div></div>}

                <footer className="return-actions">{returnStep > 1 && <button type="button" className="return-back" onClick={() => setReturnStep((step) => step - 1)}>Back</button>}<button className="submit-return-button" type="button" disabled={returnSubmitting || (returnStep === 1 && returnItemIds.length === 0)} onClick={() => returnStep < 4 ? setReturnStep((step) => step + 1) : submitReturn(order)}>{returnSubmitting ? 'Submitting…' : returnStep < 4 ? 'Continue' : 'Submit return request'}</button></footer>
              </section>
            )}

            <div className="order-items">
              {order.items.map((item) => (
                <div className={`purchase-item ${printingReturnItemId === item.id ? 'is-return-printing' : ''}`} key={item.id}>
                  <div className="purchase-image">
                    {item.imageUrls?.[0]
                      ? <img src={item.imageUrls[0]} alt={item.title} />
                      : <span>No image</span>}
                  </div>
                  <div className="purchase-item-copy">
                    <h3>{item.title}</h3>
                    <p>Sold by {item.sellerName}</p>
                    <small>{item.status.replaceAll('_', ' ')}</small>
                  </div>
                  <strong>${Number(item.price).toFixed(2)}</strong>
                  <div className="purchase-item-progress">
                    <OrderProgress status={item.status} compact />
                  </div>
                  {item.returnStatus && <div className={`return-status return-${item.returnStatus.toLowerCase()}`}>Return {item.returnStatus.replaceAll('_', ' ').toLowerCase()}{item.returnSellerNote && <small>{item.returnSellerNote}</small>}{item.returnStatus === 'NEEDS_DISCUSSION' && <button type="button" onClick={() => navigate(`/messages?returnOrderId=${order.id}&seller=${item.sellerId}`)}>Message seller</button>}{item.returnStatus === 'APPROVED' && <button type="button" onClick={() => printReturnLabel(item.id)}>Print return label · {item.returnAuthorizationCode}</button>}</div>}
                  {item.returnStatus === 'APPROVED' && <section className="return-print-label"><header><strong>CHASEL RETURN</strong><span>{item.returnAuthorizationCode}</span></header><div><small>RETURN TO</small><p>{item.returnAddress}</p></div><div><small>ITEM</small><p>{item.title}</p></div><div><small>ORDER</small><p>#{order.orderNumber}</p></div><footer>Attach this return authorization label to your package.</footer></section>}
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
            </div>
            )}
          </article>
          );
        })}
      </section>
    </main>
  );
}

export default Purchases;
