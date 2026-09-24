import ProductImageCarousel from '../ProductImageCarousel';
import BookmarkIcon from '../BookmarkIcon';
import { formatListingMeta, formatPrice } from '../../types/listing';
import type { Listing } from '../../types/listing';
import './ListingTile.css';

interface ListingTileProps {
  listing: Listing;
  saved: boolean;
  /** Disables the save control while its request is in flight. */
  saving: boolean;
  onOpen: (listingId: number) => void;
  onToggleSave: (listingId: number) => void;
  onAddToCart: (listingId: number) => void;
}

/**
 * A single piece in the browse grid.
 *
 * At rest the tile is pure editorial — image, badge, brand/price, title, meta.
 * The save and cart controls fade in on hover or keyboard focus so the grid
 * keeps its quiet rhythm without losing either action.
 */
function ListingTile({
  listing,
  saved,
  saving,
  onOpen,
  onToggleSave,
  onAddToCart,
}: ListingTileProps) {
  return (
    <article
      className="ed-tile"
      role="link"
      tabIndex={0}
      aria-label={
        listing.previousPrice
          ? `${listing.brand} ${listing.title}, ${formatPrice(listing.price)}, reduced from ${formatPrice(listing.previousPrice)}`
          : `${listing.brand} ${listing.title}, ${formatPrice(listing.price)}`
      }
      onClick={() => onOpen(listing.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(listing.id);
        }
      }}
    >
      <div className="ed-tile-frame">
        <ProductImageCarousel title={listing.title} imageUrls={listing.imageUrls} />

        {/* Save sits top-right and stays visible once the piece is saved,
            because that is state rather than a hover affordance. */}
        <button
          type="button"
          className={`ed-tile-save ${saved ? 'saved' : ''}`}
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={saved}
          disabled={saving}
          onClick={(event) => {
            event.stopPropagation();
            onToggleSave(listing.id);
          }}
        >
          <BookmarkIcon />
        </button>

        <button
          type="button"
          className="ed-tile-cart"
          onClick={(event) => {
            event.stopPropagation();
            onAddToCart(listing.id);
          }}
        >
          Add to cart
        </button>
      </div>

      <div className="ed-tile-body">
        <div className="ed-tile-line">
          <p className="ed-kicker ed-tile-brand">{listing.brand}</p>
          {listing.previousPrice ? (
            <span className="ed-figure ed-tile-price-drop">
              {formatPrice(listing.price)}
              <del className="ed-tile-previous-price">{formatPrice(listing.previousPrice)}</del>
            </span>
          ) : (
            <span className="ed-figure">{formatPrice(listing.price)}</span>
          )}
        </div>
        <h3 className="ed-tile-title">{listing.title}</h3>
        <p className="ed-meta ed-tile-meta">{formatListingMeta(listing)}</p>
      </div>
    </article>
  );
}

export default ListingTile;
