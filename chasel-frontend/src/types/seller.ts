/** The public seller summary embedded in every listing as `listing.seller`. */
export interface SellerSummary {
  id: number;
  /** "Ines M." — first name and last initial, formatted by the API. */
  displayName: string;
  avatarUrl?: string | null;
}

/** Shape returned by the public `GET /users/:id` storefront endpoint. */
export interface SellerProfile extends SellerSummary {
  state?: string | null;
  memberSince?: string | null;
}

/** Route to a seller's public storefront. */
export const sellerProfilePath = (sellerId: number) => `/sellers/${sellerId}`;

/** "May 2026" — shared by every "member since" line. */
export const formatMemberSince = (memberSince?: string | null) =>
  memberSince
    ? new Date(memberSince).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : '';
