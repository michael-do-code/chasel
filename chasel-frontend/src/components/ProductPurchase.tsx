import { useState } from 'react';
import QuantityStepper from './QuantityStepper';
import { useCart } from '../context/CartContext';
import { availableQuantity } from '../types/listing';
import type { Listing } from '../types/listing';
import { cartErrorMessage } from '../utils/cartErrors';
import './ProductPurchase.css';

interface ProductPurchaseProps {
  listing: Pick<Listing, 'id' | 'quantity' | 'status'>;
  /** Sellers see their stock but cannot buy their own listing. */
  isOwner: boolean;
}

/**
 * The buy box at the end of a product's details: how many the seller has,
 * a quantity picker capped at that stock, and "Add to cart".
 */
function ProductPurchase({ listing, isOwner }: ProductPurchaseProps) {
  const { addItem } = useCart();
  const available = availableQuantity(listing);
  const [requested, setQuantity] = useState(1);
  // Stock can shrink under the picker (an edit, a sale), so never ask for more than is left.
  const quantity = Math.max(1, Math.min(requested, available));
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const addToCart = async () => {
    setAdding(true);
    setMessage(null);
    try {
      await addItem(listing.id, quantity);
      setMessage({
        tone: 'success',
        text: `Added ${quantity} ${quantity === 1 ? 'piece' : 'pieces'} to your cart.`,
      });
      setQuantity(1);
    } catch (error) {
      console.error('Failed to add product:', error);
      setMessage({ tone: 'error', text: cartErrorMessage(error) });
    } finally {
      setAdding(false);
    }
  };

  return (
    <section className="product-purchase" aria-label="Purchase">
      <dl className="product-purchase-stock">
        <dt>Available</dt>
        <dd>
          {available > 0
            ? `${available} ${available === 1 ? 'piece' : 'pieces'}`
            : 'Sold out'}
        </dd>
      </dl>

      {isOwner ? (
        <p className="product-purchase-note">This is your listing — edit it to change the quantity.</p>
      ) : available > 0 ? (
        <div className="product-purchase-actions">
          <QuantityStepper
            value={quantity}
            max={available}
            onChange={setQuantity}
            disabled={adding}
          />
          <button
            type="button"
            className="product-purchase-add"
            disabled={adding}
            onClick={addToCart}
          >
            {adding ? 'Adding…' : 'Add to cart'}
          </button>
        </div>
      ) : (
        <p className="product-purchase-note">This piece has sold and is no longer available.</p>
      )}

      {message && (
        <p
          className={`product-purchase-message product-purchase-message-${message.tone}`}
          role={message.tone === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}

export default ProductPurchase;
