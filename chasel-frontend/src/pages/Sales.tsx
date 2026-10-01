import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import './Sales.css';

interface SaleItem {
  itemId: number;
  orderId: number;
  orderNumber: string;
  listingId: number;
  buyerName: string;
  title: string;
  price: number;
  quantity: number;
  status: 'PLACED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: string;
  shippingCode: string | null;
  shippingQrDataUrl: string | null;
  orderedAt: string;
  processingAt: string | null;
  shippedAt: string | null;
  returnStatus: string | null;
  returnReason: string | null;
  returnDetails: string | null;
  returnPreferredResolution: string | null;
  returnMediaUrls: string[];
  returnSellerNote: string | null;
  returnAddress: string | null;
  returnAuthorizationCode: string | null;
  imageUrls: string[];
}

function Sales() {
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shippingItemId, setShippingItemId] = useState<number | null>(null);
  const [printingItemId, setPrintingItemId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const linkedOrderId = Number(searchParams.get('orderId')) || null;

  const loadSales = useCallback(async () => {
    try {
      const response = await api.get<SaleItem[]>('/orders/my-sales');
      setSales(response.data);
      setError('');
    } catch (loadError) {
      console.error('Failed to load sales:', loadError);
      setError('Could not load your sales.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
    const timer = window.setInterval(loadSales, 5000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadSales();
    };
    window.addEventListener('focus', loadSales);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', loadSales);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [loadSales]);

  useEffect(() => {
    if (!linkedOrderId || loading) return;
    document.querySelector(`[data-order-id="${linkedOrderId}"]`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [linkedOrderId, loading, sales]);

  const markShipped = async (sale: SaleItem) => {
    if (!window.confirm(`Mark “${sale.title}” as shipped?`)) return;

    setShippingItemId(sale.itemId);
    setError('');
    try {
      const response = await api.post<SaleItem>(`/orders/sales/${sale.itemId}/ship`);
      setSales((current) => current.map((item) =>
        item.itemId === sale.itemId ? response.data : item
      ));
      window.dispatchEvent(new Event('chasel:notifications-changed'));
    } catch (shipError) {
      console.error('Failed to mark sale as shipped:', shipError);
      setError('This sale could not be marked as shipped. Refresh and try again.');
    } finally {
      setShippingItemId(null);
    }
  };

  const printShippingLabel = (itemId: number) => {
    setPrintingItemId(itemId);
    window.setTimeout(() => window.print(), 0);
  };

  const decideReturn = async (sale: SaleItem, action: 'approve' | 'discuss') => {
    const note = window.prompt(action === 'approve' ? 'Optional note for the buyer:' : 'What would you like to discuss with the buyer?') ?? '';
    try {
      const response = await api.post<SaleItem>(`/orders/sales/${sale.itemId}/return/${action}`, { note });
      setSales((current) => current.map((item) => item.itemId === sale.itemId ? response.data : item));
      window.dispatchEvent(new Event('chasel:notifications-changed'));
      if (action === 'discuss') navigate(`/messages?returnOrderId=${sale.orderId}&buyer=${encodeURIComponent(sale.buyerName)}`);
    } catch (decisionError) {
      console.error('Failed to update return:', decisionError);
      setError('The return request could not be updated.');
    }
  };

  useEffect(() => {
    const finishPrinting = () => setPrintingItemId(null);
    window.addEventListener('afterprint', finishPrinting);
    return () => window.removeEventListener('afterprint', finishPrinting);
  }, []);

  return (
    <main className="sales-page">
      <header className="sales-header">
        <span>SELLER CENTER</span>
        <h1>Sales</h1>
        <p>Orders remain on hold during the buyer’s cancellation window, then become ready to ship.</p>
      </header>

      {loading && <p className="sales-message">Loading sales…</p>}
      {error && <p className="sales-message sales-error">{error}</p>}
      {!loading && !error && sales.length === 0 && (
        <section className="sales-empty">
          <h2>No sales yet</h2>
          <p>Purchased items from your listings will appear here.</p>
        </section>
      )}

      <section className="sales-list">
        {sales.map((sale) => (
          <article
            data-order-id={sale.orderId}
            className={`sale-card ${linkedOrderId === sale.orderId ? 'is-linked' : ''} ${printingItemId === sale.itemId ? 'is-printing' : ''}`}
            key={sale.itemId}
          >
            <div className="sale-image">
              {sale.imageUrls?.[0]
                ? <img src={sale.imageUrls[0]} alt={sale.title} />
                : <span>No image</span>}
            </div>

            <div className="sale-details">
              <div className="sale-summary">
                <div className="sale-heading">
                  <div>
                    <span>ORDER #{sale.orderNumber}</span>
                    <h2>{sale.title}</h2>
                  </div>
                  <strong>{sale.status.replaceAll('_', ' ')}</strong>
                </div>
                <p>Buyer: {sale.buyerName}</p>
                <p>Ordered {new Date(sale.orderedAt).toLocaleString()}</p>
                <p className="sale-price">${Number(sale.price).toFixed(2)}</p>
              </div>

              {sale.status === 'PLACED' && (
                <div className="sale-notice waiting">
                  Waiting for the buyer’s cancellation window to end. Do not ship yet.
                </div>
              )}

              {(sale.status === 'PROCESSING' || sale.status === 'SHIPPED') && (
                <div className="fulfillment-panel">
                  <div>
                    <span>SHIP TO</span>
                    <p>{sale.shippingAddress}</p>
                  </div>
                  <div>
                    <span>FULFILLMENT CODE</span>
                    <code>{sale.shippingCode}</code>
                  </div>
                  {sale.shippingQrDataUrl && (
                    <div className="fulfillment-qr">
                      <span>FULFILLMENT QR</span>
                      <img src={sale.shippingQrDataUrl} alt={`Fulfillment QR for order ${sale.orderNumber}`} />
                      <p>Scan to identify this Chasel shipment.</p>
                    </div>
                  )}
                  <small>This is an internal reference, not a prepaid carrier label or carrier QR code.</small>
                  <button className="print-label-button" type="button" onClick={() => printShippingLabel(sale.itemId)}>
                    Print shipping label
                  </button>
                </div>
              )}

              <section className="shipping-label" aria-hidden="true">
                <header><strong>CHASEL</strong><span>ORDER #{sale.orderNumber}</span></header>
                <div><span>SHIP TO</span><p>{sale.shippingAddress}</p></div>
                <div><span>ITEM</span><p>{sale.title}</p></div>
                <div><span>FULFILLMENT CODE</span><code>{sale.shippingCode}</code></div>
                {sale.shippingQrDataUrl && <img src={sale.shippingQrDataUrl} alt="" />}
                <small>Internal Chasel fulfillment label — carrier postage not included.</small>
              </section>

              {sale.status === 'PROCESSING' && (
                <button
                  className="mark-shipped-button"
                  type="button"
                  disabled={shippingItemId === sale.itemId}
                  onClick={() => markShipped(sale)}
                >
                  {shippingItemId === sale.itemId ? 'Updating…' : 'Mark as shipped'}
                </button>
              )}

              {sale.status === 'CANCELLED' && (
                <div className="sale-notice cancelled">The buyer cancelled this order.</div>
              )}

              {sale.returnStatus && (
                <section className={`seller-return-panel state-${sale.returnStatus.toLowerCase()}`}>
                  <header><div><span>RETURN REQUEST</span><h3>{sale.returnStatus.replaceAll('_', ' ')}</h3></div><strong>{sale.returnPreferredResolution}</strong></header>
                  <dl><div><dt>Reason</dt><dd>{sale.returnReason}</dd></div>{sale.returnDetails && <div><dt>Buyer’s details</dt><dd>{sale.returnDetails}</dd></div>}</dl>
                  {sale.returnMediaUrls?.length > 0 && <div className="seller-return-media">{sale.returnMediaUrls.map((url) => /\.(mp4|mov|webm)(\?|$)/i.test(url) ? <video key={url} controls src={url}/> : <img key={url} src={url} alt="Buyer return evidence"/>)}</div>}
                  {sale.returnSellerNote && <p className="seller-return-note">Your note: {sale.returnSellerNote}</p>}
                  {(sale.returnStatus === 'REQUESTED' || sale.returnStatus === 'NEEDS_DISCUSSION') && <div className="seller-return-actions"><button type="button" className="approve" onClick={() => decideReturn(sale, 'approve')}>Approve & issue label</button><button type="button" onClick={() => decideReturn(sale, 'discuss')}>Message buyer first</button></div>}
                  {sale.returnStatus === 'APPROVED' && <p className="seller-return-approved">Return authorized · {sale.returnAuthorizationCode}</p>}
                </section>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Sales;
