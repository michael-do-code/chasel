package com.app.chasel.model;

/** Overall lifecycle of a buyer's checkout. */
public enum OrderStatus {
    PLACED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED
}
