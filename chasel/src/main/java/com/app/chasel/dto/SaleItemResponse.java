package com.app.chasel.dto;

import com.app.chasel.model.OrderItemStatus;
import com.app.chasel.model.ReturnStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SaleItemResponse(
        Long itemId,
        Long orderId,
        String orderNumber,
        Long listingId,
        String buyerName,
        String title,
        BigDecimal price,
        Integer quantity,
        OrderItemStatus status,
        String shippingAddress,
        String shippingCode,
        String shippingQrDataUrl,
        LocalDateTime orderedAt,
        LocalDateTime processingAt,
        LocalDateTime shippedAt,
        ReturnStatus returnStatus,
        String returnReason,
        String returnDetails,
        String returnPreferredResolution,
        List<String> returnMediaUrls,
        String returnSellerNote,
        String returnAddress,
        String returnAuthorizationCode,
        List<String> imageUrls
) {
}
