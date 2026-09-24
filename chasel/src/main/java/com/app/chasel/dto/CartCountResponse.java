package com.app.chasel.dto;

/**
 * Lightweight payload for the navbar cart badge.
 *
 * Returned as an object rather than a bare number so the endpoint can grow
 * (distinct lines, subtotal) without breaking existing clients.
 */
public record CartCountResponse(int count) {
}
