package com.app.chasel.model;

/**
 * Each item has its own status because one checkout can contain products from
 * several sellers and those products may be shipped independently.
 */
public enum OrderItemStatus {
    PLACED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED
}
