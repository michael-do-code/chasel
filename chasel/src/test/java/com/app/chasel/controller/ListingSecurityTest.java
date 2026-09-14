package com.app.chasel.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.app.chasel.model.Listing;
import com.app.chasel.model.ListingStatus;
import com.app.chasel.model.Users;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.UserRepository;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Guests must be able to browse listings without an account, but every
 * write action (and the "my listings" view) must still require auth.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ListingSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    private Long seededListingId;

    @BeforeEach
    void seedListing() {
        Users seller = new Users();
        seller.setEmail("seller-" + System.nanoTime() + "@example.com");
        seller.setPassword("irrelevant-hash");
        seller = userRepository.save(seller);

        Listing listing = new Listing();
        listing.setTitle("Test Item");
        listing.setBrand("Test Brand");
        listing.setCategory("Clothing");
        listing.setPrice(10.0);
        listing.setStatus(ListingStatus.ACTIVE);
        listing.setSeller(seller);
        seededListingId = listingRepository.save(listing).getId();
    }

    @Test
    void anonymousCanBrowseAllListings() throws Exception {
        mockMvc.perform(get("/api/listings"))
                .andExpect(status().isOk());
    }

    @Test
    void anonymousCanViewSingleListing() throws Exception {
        mockMvc.perform(get("/api/listings/" + seededListingId))
                .andExpect(status().isOk());
    }

    @Test
    void anonymousCanBrowseTrendingListings() throws Exception {
        mockMvc.perform(get("/api/listings/trending"))
                .andExpect(status().isOk());
    }

    @Test
    void anonymousCannotSeeMyListings() throws Exception {
        mockMvc.perform(get("/api/listings/mine"))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousCannotCreateListing() throws Exception {
        mockMvc.perform(post("/api/listings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }
}
