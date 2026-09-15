package com.app.chasel.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String message,
        Long relatedListingId,
        boolean read,
        LocalDateTime createdAt
) {
}
