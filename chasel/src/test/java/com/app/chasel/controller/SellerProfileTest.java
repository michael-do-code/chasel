package com.app.chasel.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import com.app.chasel.model.Listing;
import com.app.chasel.model.ListingStatus;
import com.app.chasel.model.Users;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.UserRepository;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Listings and seller storefronts are public, so they may expose a seller's
 * display name and avatar — and nothing from their account.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SellerProfileTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    private Long sellerId;
    private Long activeListingId;

    @BeforeEach
    void seedSeller() {
        Users seller = new Users();
        seller.setEmail("storefront-" + System.nanoTime() + "@example.com");
        seller.setPassword("secret-hash");
        seller.setFirstName("Ines");
        seller.setLastName("Moreau");
        seller.setPhone("555-0100");
        seller.setState("Washington");
        seller.setResetCode("123456");
        seller = userRepository.save(seller);
        sellerId = seller.getId();

        activeListingId = listingRepository.save(listing(seller, ListingStatus.ACTIVE)).getId();
        listingRepository.save(listing(seller, ListingStatus.SOLD));
        listingRepository.save(listing(seller, ListingStatus.DRAFT));
    }

    private static Listing listing(Users seller, ListingStatus status) {
        Listing listing = new Listing();
        listing.setTitle("Piece " + status);
        listing.setBrand("Test Brand");
        listing.setCategory("Clothing");
        listing.setPrice(10.0);
        listing.setStatus(status);
        listing.setSeller(seller);
        return listing;
    }

    @Test
    void listingExposesOnlySellerSummary() throws Exception {
        mockMvc.perform(get("/api/listings/" + activeListingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.seller.id").value(sellerId))
                .andExpect(jsonPath("$.seller.displayName").value("Ines M."))
                .andExpect(jsonPath("$.seller.email").doesNotExist())
                .andExpect(jsonPath("$.seller.password").doesNotExist())
                .andExpect(jsonPath("$.seller.phone").doesNotExist())
                .andExpect(jsonPath("$.seller.resetCode").doesNotExist())
                .andExpect(jsonPath("$.sellerSummary").doesNotExist());
    }

    @Test
    void anonymousCanViewSellerProfile() throws Exception {
        mockMvc.perform(get("/api/users/" + sellerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Ines M."))
                .andExpect(jsonPath("$.state").value("Washington"))
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.phone").doesNotExist());
    }

    @Test
    void unknownSellerIsNotFound() throws Exception {
        mockMvc.perform(get("/api/users/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void ownProfileStillRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    void storefrontListsOnlyActivePieces() throws Exception {
        mockMvc.perform(get("/api/listings/seller/" + sellerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(activeListingId));
    }
}
