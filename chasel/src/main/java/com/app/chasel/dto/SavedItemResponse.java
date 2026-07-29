package com.app.chasel.dto;

import java.util.List;

public record SavedItemResponse(
        Long savedItemId,
        Long productId,
        String title,
        Double price,
        List<String> imageUrls
) {
}