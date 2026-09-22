package com.app.chasel.dto;

/**
 * Lightweight payload for the navbar saved-items badge.
 *
 * Mirrors {@link CartCountResponse}: the badge only needs a number, while
 * {@code GET /api/saved-items} returns a full listing per saved piece.
 */
public record SavedItemCountResponse(int count) {
}
