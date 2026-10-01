package com.app.chasel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CheckoutRequest(
        @NotBlank(message = "Shipping address is required")
        @Size(max = 1000, message = "Shipping address is too long")
        String shippingAddress,
        @Size(max = 50, message = "Promo code is too long")
        String promoCode
) {
}
