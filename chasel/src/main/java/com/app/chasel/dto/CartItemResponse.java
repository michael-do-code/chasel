package com.app.chasel.dto;

import java.util.List;

public record CartItemResponse(
        Long cartItemId,
        Long productId,
        String title,
        Double price,
        List<String> imageUrls,
        Integer quantity
) {
}