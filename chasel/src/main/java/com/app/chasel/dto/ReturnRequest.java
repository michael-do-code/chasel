package com.app.chasel.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record ReturnRequest(
        @NotEmpty List<Long> itemIds,
        @NotBlank String reason,
        String details,
        String preferredResolution,
        List<String> mediaUrls
) {
}
