package com.app.chasel.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record GuestCheckoutRequest(
        @Email @NotBlank String email,
        @NotBlank String phone,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Size(max = 1000) String shippingAddress,
        @Size(max = 50) String promoCode,
        @NotEmpty List<@Valid GuestCheckoutItemRequest> items
) {}
