# Price-drop notifications — design

## Problem

`Notifications.tsx` currently renders a hardcoded array of 7 fake
notifications (`initialNotifications`). There is no backend notion of a
notification at all — no entity, no table, no endpoint. Marking one "read"
only mutates local component state, so it resets on every page reload or
for every different logged-in user.

This feature replaces that mock with a real, per-user notification system,
with exactly one producer to start: when a seller lowers the price on a
listing, everyone who has that listing saved (wishlisted) gets a
notification.

## Goals

- Delete the mock notification data.
- When a listing's price drops (the existing `previousPrice` logic in
  `ListingController.updateListing` fires), notify every user who has that
  listing in their saved items.
- Notifications persist per-user in the database and survive reload/logout.
- The navbar bell's unread badge and dropdown both reflect real data.
- Clicking a price-drop notification marks it read and navigates to that
  listing's Product Detail page.

## Non-goals

- Real-time / live push delivery (websockets, SSE). Notifications are
  fetched on page load and whenever the dropdown opens — a user won't see
  a new one appear instantly without a reload or reopening the dropdown.
- Any notification type other than price drops (the mock "order shipped"
  and "new review" types are removed, not ported — nothing on the backend
  produces them).
- Emailing or otherwise notifying outside the app.
- Historical backfill — only price drops that happen after this ships
  create notifications.

## Backend design

### New: `Notification` entity (table `notifications`)

| Column | Type | Notes |
|---|---|---|
| `id` | `Long` | PK, identity |
| `user_id` | FK → `users` | who the notification is for |
| `type` | `String` (enum-backed) | starts with just `PRICE_DROP`; stored as a string so future types don't need a migration |
| `title` | `String` | e.g. "Price drop" |
| `message` | `String` | e.g. `"Archive Trench Coat" dropped from $480.00 to $340.00.` |
| `related_listing_id` | `Long`, nullable | click-through target; nullable so future notification types without a listing still fit the same table |
| `read` | `boolean`, default `false` | |
| `created_at` | `LocalDateTime` | set on creation, matches the `@PrePersist` convention already used on `Listing` |

Uses `ddl-auto=update`, so this table is created automatically on next
backend start — no manual migration.

### New: `NotificationRepository`

```java
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(Users user);
}
```

### Changed: `SavedItemRepository`

Add one method:

```java
List<SavedItem> findByProduct(Listing product);
```

(`deleteByProduct` already exists on this repository, so this follows the
same shape.)

### New: `NotificationService`

Mirrors the existing `SavedItemService` pattern (a thin service between
controller and repository).

```java
public void notifyPriceDrop(Listing listing) {
    List<SavedItem> watchers = savedItemRepository.findByProduct(listing);

    for (SavedItem watcher : watchers) {
        Users recipient = watcher.getUser();

        // A seller who saved their own listing doesn't need telling.
        if (recipient.getId().equals(listing.getSeller().getId())) continue;

        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setType(NotificationType.PRICE_DROP);
        notification.setTitle("Price drop");
        notification.setMessage(buildMessage(listing));
        notification.setRelatedListingId(listing.getId());
        notificationRepository.save(notification);
    }
}

private String buildMessage(Listing listing) {
    return "\"%s\" dropped from $%.2f to $%.2f.".formatted(
        listing.getTitle(), listing.getPreviousPrice(), listing.getPrice()
    );
}
```

### Changed: `ListingController.updateListing`

Track whether this update is a genuine drop, keep the method's existing
single save at the end, and notify only after that save succeeds:

```java
boolean priceDropped = request.getPrice() < listing.getPrice();
if (priceDropped) {
    listing.setPreviousPrice(listing.getPrice());
} else {
    listing.setPreviousPrice(null);
}
listing.setPrice(request.getPrice());

// ...existing imageUrls/location handling, unchanged...

Listing saved = listingRepository.save(listing);

if (priceDropped) {
    notificationService.notifyPriceDrop(saved);
}

return saved;
```

`notifyPriceDrop` only reads getters on the in-memory `Listing` object
(title, price, previousPrice, id, seller) — none of that needs a fresh
database read, so a single save at the end (same as today) is enough;
no early/extra save required.

### New: `NotificationController`

| Method | Path | Behavior |
|---|---|---|
| `GET` | `/api/notifications` | current user's notifications, newest first |
| `PATCH` | `/api/notifications/{id}/read` | marks one as read (404/403-style `RuntimeException` if it isn't the caller's) |
| `PATCH` | `/api/notifications/read-all` | marks all of the current user's as read |

Follows the existing `Authentication` → `userRepository.findByEmail(...)`
pattern used in `SavedItemController`/`ListingController`.

## Frontend design

### `Notifications.tsx`

- Delete `initialNotifications` and the `NotificationType` union's
  `'order' | 'rating' | 'general'` members — replace with whatever the
  backend's `type` field sends (just `'PRICE_DROP'` for now, kept as a
  string union so adding a type later is a one-line change).
- Fetch `GET /api/notifications` in a `useEffect` on mount (not just when
  `open` becomes `true`) so the unread badge is correct even before the
  user opens the dropdown, and again each time it opens (covers the
  no-live-push gap — reopening is how you see anything new).
- `markAsRead(id)` → `PATCH /api/notifications/{id}/read`, then update
  local state optimistically.
- `markAllAsRead()` → `PATCH /api/notifications/read-all`, same
  optimistic update.
- Clicking a notification: mark it read, then if `relatedListingId` is
  present, `navigate(`/items/${relatedListingId}`)` and close the
  dropdown.
- Loading state while the initial fetch is in flight; empty state stays
  as-is ("You're all caught up.").

### `Navbar.tsx`

No structural change — it already just renders `<Notifications open=...
onUnreadCountChange={setUnreadCount} />`. The badge continues to reflect
whatever `Notifications` reports, which now comes from real data instead
of mock state.

## Testing plan

**Backend (TDD, following the existing `ListingPriceDropTest` pattern —
real JWTs via `JwtUtil`, no `spring-security-test`)**:
- Dropping a price on a listing saved by 2 users creates exactly 2
  notifications, one per watcher, with the correct message/listing link.
- A user who has *not* saved the listing gets nothing.
- The seller does not get self-notified even if they saved their own
  listing.
- Raising the price (no drop) creates no notifications.
- `GET /api/notifications` only returns the caller's own notifications.
- `PATCH .../read` and `PATCH .../read-all` persist and are scoped to the
  caller.

**Frontend**: `npm run build` / `npm run lint` on touched files, then a
browser run — register two accounts, save a listing as user A, drop its
price as the seller (user B), log back in as A, confirm the badge and
dropdown show the real notification, click it, confirm it navigates to
the product page and the badge decrements.

## Open questions / judgment calls made explicit

- **Self-notification guard**: skipping the seller if they saved their
  own listing was not explicitly asked for, but seemed obviously correct
  (no one needs to be told their own price change happened). Flagging in
  case that's wrong.
