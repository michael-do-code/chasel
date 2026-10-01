package com.app.chasel.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GuestCheckoutItemRequest(
        @NotNull Long productId,
        @Min(1) int quantity
) {}
