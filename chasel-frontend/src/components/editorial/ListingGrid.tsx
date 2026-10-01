import ListingTile from './ListingTile';
import { DEFAULT_GRID_COLUMNS } from './gridColumns';
import { useListingActions } from '../../hooks/useListingActions';
import type { Listing } from '../../types/listing';
import './ListingGrid.css';

interface ListingGridProps {
  listings: Listing[];
  /** Tiles per row on wide screens; narrower screens cap it. */
  columns?: number;
}

/**
 * The editorial tile grid shared by Browsing and seller storefronts.
 * Owns the save / cart / open wiring so each page only supplies listings.
 */
function ListingGrid({ listings, columns = DEFAULT_GRID_COLUMNS }: ListingGridProps) {
  const { isSaved, savingProductId, toggleSaved, openListing, addToCart, canAddToCart } =
    useListingActions(listings);

  return (
    <div
      className="ed-listing-grid"
      style={{ '--grid-columns': columns } as React.CSSProperties}
    >
      {listings.map((listing) => (
        <ListingTile
          key={listing.id}
          listing={listing}
          saved={isSaved(listing.id)}
          saving={savingProductId === listing.id}
          onOpen={openListing}
          onToggleSave={toggleSaved}
          onAddToCart={addToCart}
          canAddToCart={canAddToCart(listing.id)}
        />
      ))}
    </div>
  );
}

export default ListingGrid;
