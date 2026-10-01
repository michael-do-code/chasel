package com.app.chasel.dto;

import com.app.chasel.model.Users;

import java.time.LocalDateTime;

/** Shape returned by the public `GET /api/users/{id}` — a seller's storefront header. */
public class SellerProfileResponse {
    private final Long id;
    private final String displayName;
    private final String avatarUrl;
    private final String state;
    private final LocalDateTime memberSince;

    public SellerProfileResponse(Long id, String displayName, String avatarUrl,
                                 String state, LocalDateTime memberSince) {
        this.id = id;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.state = state;
        this.memberSince = memberSince;
    }

    public static SellerProfileResponse from(Users user) {
        return new SellerProfileResponse(
                user.getId(),
                SellerSummary.displayName(user),
                user.getAvatarUrl(),
                user.getState(),
                user.getCreatedAt());
    }

    public Long getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getState() {
        return state;
    }

    public LocalDateTime getMemberSince() {
        return memberSince;
    }
}
