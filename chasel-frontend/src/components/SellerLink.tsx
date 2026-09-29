import { Link } from 'react-router-dom';
import Avatar from './editorial/Avatar';
import { sellerProfilePath } from '../types/seller';
import type { SellerSummary } from '../types/seller';
import './SellerLink.css';

interface SellerLinkProps {
  seller: SellerSummary;
  /** The viewer is this seller: link to their own /profile instead. */
  isSelf?: boolean;
  label?: string;
}

/** "Sold by [avatar] Ines M. →" — links a listing to its seller's storefront. */
function SellerLink({ seller, isSelf = false, label = 'Sold by' }: SellerLinkProps) {
  return (
    <Link
      className="seller-link"
      to={isSelf ? '/profile' : sellerProfilePath(seller.id)}
      aria-label={isSelf ? 'Sold by you — view your profile' : `${label} ${seller.displayName} — view profile`}
    >
      <Avatar name={seller.displayName} imageUrl={seller.avatarUrl} size="sm" />
      <span className="seller-link-text">
        <span className="seller-link-label">{label}</span>
        <span className="seller-link-name">{isSelf ? 'You' : seller.displayName}</span>
      </span>
      <span className="seller-link-arrow" aria-hidden="true">→</span>
    </Link>
  );
}

export default SellerLink;
