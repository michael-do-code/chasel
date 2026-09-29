package com.app.chasel.dto;

import com.app.chasel.model.Users;

/**
 * The public face of a seller: what any visitor may see next to a listing.
 * Never add contact or account fields here — this is served to guests.
 */
public class SellerSummary {
    private final Long id;
    private final String displayName;
    private final String avatarUrl;

    public SellerSummary(Long id, String displayName, String avatarUrl) {
        this.id = id;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
    }

    public static SellerSummary from(Users seller) {
        return new SellerSummary(seller.getId(), displayName(seller), seller.getAvatarUrl());
    }

    /** "Ines M." — first name plus last initial, so full names stay private. */
    public static String displayName(Users user) {
        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim();
        if (firstName.isEmpty()) {
            return lastName.isEmpty() ? "Seller" : lastName.charAt(0) + ".";
        }
        return lastName.isEmpty() ? firstName : firstName + " " + lastName.charAt(0) + ".";
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
}
