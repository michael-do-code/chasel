import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './SavedItems.css';

interface SavedItem {
  savedItemId: number;
  productId: number;
  title: string;
  price: number;
  imageUrls?: string[];
}

function SavedItems() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSavedItems = async () => {
      try {
        const response = await api.get<SavedItem[]>('/saved-items');
        setItems(response.data);
      } catch (error) {
        console.error('Failed to load saved items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedItems();
  }, []);

  const removeSavedItem = async (productId: number) => {
    setRemovingId(productId);

    try {
      await api.delete(`/saved-items/${productId}`);
      setItems((current) =>
        current.filter((item) => item.productId !== productId)
      );
    } catch (error) {
      console.error('Failed to remove saved item:', error);
      alert('Could not remove this item.');
    } finally {
      setRemovingId(null);
    }
  };

  const addToCart = async (productId: number) => {
    try {
      await api.post(`/cart/items/${productId}`);
      alert('Added to cart!');
    } catch (error) {
      console.error('Failed to add product to cart:', error);
      alert('Could not add this product to cart.');
    }
  };

  return (
    <main className="saved-page">
      <header className="saved-header">
        <span>YOUR COLLECTION</span>
        <h1>Saved Items</h1>
        <p>Pieces you love, kept together for later.</p>
      </header>

      {loading && <p className="saved-status">Loading saved items…</p>}

      {!loading && items.length === 0 && (
        <section className="saved-empty">
          <div className="saved-empty-heart">♡</div>
          <h2>Nothing saved yet</h2>
          <p>Tap the heart on a product to keep it here.</p>
          <button type="button" onClick={() => navigate('/home')}>
            Browse items
          </button>
        </section>
      )}

      {!loading && items.length > 0 && (
        <section className="saved-grid">
          {items.map((item) => (
            <article className="saved-card" key={item.savedItemId}>
              <div className="saved-image">
                {item.imageUrls?.[0] ? (
                  <img src={item.imageUrls[0]} alt={item.title} />
                ) : (
                  <span>No image</span>
                )}

                <button
                  type="button"
                  className="saved-heart"
                  aria-label="Remove from saved items"
                  disabled={removingId === item.productId}
                  onClick={() => removeSavedItem(item.productId)}
                >
                  ♥
                </button>
              </div>

              <div className="saved-card-info">
                <div>
                  <h2>{item.title}</h2>
                  <strong>${item.price.toFixed(2)}</strong>
                </div>

                <button
                  type="button"
                  className="saved-add-cart"
                  onClick={() => addToCart(item.productId)}
                >
                  Add to Cart
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default SavedItems;
