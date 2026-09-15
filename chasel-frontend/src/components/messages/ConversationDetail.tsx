import Avatar from '../editorial/Avatar';
import { formatPrice } from '../../types/listing';
import type { Conversation } from '../../data/conversations';

interface ConversationDetailProps {
  conversation: Conversation;
  onViewListing: (listingId: number) => void;
  onRespondToOffer: (response: 'accept' | 'counter' | 'decline') => void;
}

/** Right rail: what the conversation is about, and what to do about it. */
function ConversationDetail({
  conversation,
  onViewListing,
  onRespondToOffer,
}: ConversationDetailProps) {
  const { listing, seller } = conversation;

  return (
    <aside className="messages-detail" aria-label="Conversation details">
      <p className="ed-kicker">Conversation about</p>

      <button
        type="button"
        className="messages-detail-image"
        style={listing.imageUrl ? { backgroundImage: `url(${listing.imageUrl})` } : undefined}
        aria-label={`View ${listing.title}`}
        onClick={() => onViewListing(listing.id)}
      />

      <p className="ed-kicker messages-detail-brand">{listing.brand}</p>
      <h2 className="ed-display messages-detail-title">{listing.title}</h2>
      <p className="ed-meta">Size {listing.size} · {listing.condition}</p>

      <hr className="ed-rule messages-detail-rule" />

      <div className="messages-detail-price">
        <span className="ed-kicker">Listed at</span>
        <span className="ed-figure messages-detail-figure">{formatPrice(listing.price)}</span>
      </div>

      <div className="messages-detail-actions">
        <button
          type="button"
          className="ed-btn ed-btn-solid"
          onClick={() => onRespondToOffer('accept')}
        >
          Accept offer
        </button>
        <button
          type="button"
          className="ed-btn ed-btn-outline"
          onClick={() => onRespondToOffer('counter')}
        >
          Counter offer
        </button>
        <button
          type="button"
          className="ed-btn ed-btn-quiet"
          onClick={() => onRespondToOffer('decline')}
        >
          Decline
        </button>
      </div>

      <hr className="ed-rule messages-detail-rule" />

      <p className="ed-kicker">Seller</p>
      <div className="messages-detail-seller">
        <Avatar name={seller.name} size="sm" />
        <div>
          <p className="messages-detail-seller-name">{seller.name}</p>
          <p className="ed-meta">{seller.sales} sales · {seller.rating.toFixed(1)} rating</p>
        </div>
      </div>
    </aside>
  );
}

export default ConversationDetail;
