import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './SellItem.css';

function SellItem() {
  const [states, setStates] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [openToTrade, setOpenToTrade] = useState(false);
  const [tradeDescription, setTradeDescription] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    api.get<string[]>('/options/states').then((res) => setStates(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/listings', {
        title,
        description,
        category,
        price: price ? parseFloat(price) : null,
        openToTrade,
        tradeDescription: openToTrade ? tradeDescription : null,
        imageUrls: [],
        location: location || null, // falls back to seller's profile location on the backend
      });

      setSuccess('Listing created!');
      setTimeout(() => navigate('/my-listings'), 1000);
    } catch (err) {
      setError('Something went wrong creating the listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-container">
      <h1>Sell an Item</h1>

      <form onSubmit={handleSubmit} className="sell-form">
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </label>

        <label>
          Category
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Handbags, Watches, Shoes"
            required
          />
        </label>

        <label>
          Price (USD)
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="800"
          />
        </label>

        <label>
          State
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">Use my profile location</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={openToTrade}
            onChange={(e) => setOpenToTrade(e.target.checked)}
          />
          Open to trade
        </label>

        {openToTrade && (
          <label>
            What would you trade for?
            <input
              value={tradeDescription}
              onChange={(e) => setTradeDescription(e.target.value)}
              placeholder="e.g. Dior Saddle Bag, size M"
            />
          </label>
        )}

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Publishing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}

export default SellItem;