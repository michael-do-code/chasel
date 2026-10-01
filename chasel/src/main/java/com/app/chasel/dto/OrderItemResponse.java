package com.app.chasel.dto;

import com.app.chasel.model.OrderItemStatus;
import com.app.chasel.model.ReturnStatus;

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
        ReturnStatus returnStatus,
        String returnAddress,
        String returnReason,
        String returnDetails,
        String returnPreferredResolution,
        List<String> returnMediaUrls,
        String returnSellerNote,
        String returnAuthorizationCode,
        List<String> imageUrls
) {
}
