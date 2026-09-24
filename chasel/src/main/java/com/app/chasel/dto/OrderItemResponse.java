package com.app.chasel.dto;

import com.app.chasel.model.OrderItemStatus;

import java.math.BigDecimal;
import java.util.List;

public record OrderItemResponse(
        Long id,
        Long listingId,
        Long sellerId,
        String sellerName,
        String title,
        BigDecimal price,
        Integer quantity,
        OrderItemStatus status,
        List<String> imageUrls
) {
}
