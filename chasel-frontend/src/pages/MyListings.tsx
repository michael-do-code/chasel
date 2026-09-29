import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeading from '../components/editorial/PageHeading';
import OwnerListingGrid from '../components/OwnerListingGrid';
import { useMyListings, type OwnerListing } from '../hooks/useMyListings';
import '../styles/marketplace.css';
import './MyListings.css';

type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low';

const sortLabels: Record<SortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  'price-high': 'Price: high to low',
  'price-low': 'Price: low to high',
};

function sortListings(listings: OwnerListing[], sort: SortOption): OwnerListing[] {
  // The hook already returns newest first.
  if (sort === 'newest') return listings;
  const sorted = [...listings];
  if (sort === 'oldest') return sorted.reverse();
  // Unpriced listings sink to the end either way.
  const price = (l: OwnerListing) => l.price ?? (sort === 'price-high' ? -Infinity : Infinity);
  return sorted.sort((a, b) => (sort === 'price-high' ? price(b) - price(a) : price(a) - price(b)));
}

function MyListings() {
  const { listings, loading, error, replaceListing, removeListing } = useMyListings();
  const [sort, setSort] = useState<SortOption>('newest');
  const navigate = useNavigate();

  const pieceCount = `${listings.length} ${listings.length === 1 ? 'piece' : 'pieces'}`;

  return (
    <div className="my-listings">
      <div className="my-listings-shell">
        <PageHeading
          kicker={`Your account · ${pieceCount}`}
          title="My listings"
          lede="Everything you've listed on Chasel. Edit details or remove pieces you no longer want to sell."
        >
          <hr className="ed-rule my-listings-rule" />

          <div className="my-listings-controls">
            <Link to="/profile" className="my-listings-back">← Back to profile</Link>

            <div className="my-listings-actions">
              <label className="my-listings-sort">
                <span>Sort</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}>
                  {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                    <option key={option} value={option}>{sortLabels[option]}</option>
                  ))}
                </select>
              </label>
              <button type="button" className="ed-btn ed-btn-solid" onClick={() => navigate('/sell-item')}>
                List an item
              </button>
            </div>
          </div>
        </PageHeading>

        <div className="my-listings-body">
          {loading && <p className="my-listings-status">Loading your listings…</p>}
          {error && <p className="my-listings-status my-listings-status-error" role="alert">{error}</p>}

          {!loading && !error && listings.length === 0 && (
            <div className="my-listings-empty">
              <h2 className="ed-display">Nothing listed yet</h2>
              <p>When you list a piece, it will show up here.</p>
              <button type="button" className="ed-btn ed-btn-outline" onClick={() => navigate('/sell-item')}>
                List your first item
              </button>
            </div>
          )}

          {listings.length > 0 && (
            <OwnerListingGrid
              listings={sortListings(listings, sort)}
              onUpdated={replaceListing}
              onDeleted={removeListing}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default MyListings;
