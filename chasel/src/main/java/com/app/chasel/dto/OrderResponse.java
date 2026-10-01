package com.app.chasel.dto;

import com.app.chasel.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        Long buyerId,
        BigDecimal totalAmount,
        BigDecimal taxAmount,
        BigDecimal deliveryAmount,
        OrderStatus status,
        String shippingAddress,
        LocalDateTime createdAt,
        LocalDateTime cancelUntil,
        LocalDateTime cancelledAt,
        boolean cancellable,
        List<OrderItemResponse> items
) {
}
