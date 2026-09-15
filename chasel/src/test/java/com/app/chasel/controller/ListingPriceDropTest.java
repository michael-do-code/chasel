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
import com.app.chasel.model.Notification;
import com.app.chasel.model.SavedItem;
import com.app.chasel.model.Users;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.NotificationRepository;
import com.app.chasel.repository.SavedItemRepository;
import com.app.chasel.repository.UserRepository;
import com.app.chasel.security.JwtUtil;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Editing a listing's price down should mark it as a price drop (so the
 * frontend can show the old price struck through); editing it back up
 * should clear that mark.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ListingPriceDropTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SavedItemRepository savedItemRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private String sellerToken;
    private Long listingId;

    @BeforeEach
    void seedListing() {
        Users seller = new Users();
        seller.setEmail("price-drop-seller-" + System.nanoTime() + "@example.com");
        seller.setPassword("irrelevant-hash");
        seller = userRepository.save(seller);
        sellerToken = jwtUtil.generateToken(seller.getEmail());

        Listing listing = new Listing();
        listing.setTitle("Test Jacket");
        listing.setBrand("Test Brand");
        listing.setCategory("Clothing");
        listing.setPrice(100.0);
        listing.setStatus(ListingStatus.ACTIVE);
        listing.setSeller(seller);
        listingId = listingRepository.save(listing).getId();
    }

    private String updatePayload(double price) {
        return """
                {
                  "title": "Test Jacket",
                  "brand": "Test Brand",
                  "category": "Clothing",
                  "condition": "Good",
                  "price": %s
                }
                """.formatted(price);
    }

    @Test
    void loweringPriceRecordsThePreviousPrice() throws Exception {
        mockMvc.perform(put("/api/listings/" + listingId)
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload(80.0)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(80.0))
                .andExpect(jsonPath("$.previousPrice").value(100.0));
    }

    @Test
    void raisingPriceClearsThePreviousPrice() throws Exception {
        // First drop the price...
        mockMvc.perform(put("/api/listings/" + listingId)
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload(80.0)))
                .andExpect(status().isOk());

        // ...then raise it back up. The markdown no longer applies.
        mockMvc.perform(put("/api/listings/" + listingId)
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload(120.0)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(120.0))
                .andExpect(jsonPath("$.previousPrice").doesNotExist());
    }

    @Test
    void unchangedPriceDoesNotRecordAPreviousPrice() throws Exception {
        mockMvc.perform(put("/api/listings/" + listingId)
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload(100.0)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.previousPrice").doesNotExist());
    }

    @Test
    void loweringPriceNotifiesUsersWhoSavedTheListing() throws Exception {
        Users watcher = new Users();
        watcher.setEmail("watcher-" + System.nanoTime() + "@example.com");
        watcher.setPassword("irrelevant-hash");
        watcher = userRepository.save(watcher);

        Listing listing = listingRepository.findById(listingId).orElseThrow();
        SavedItem savedItem = new SavedItem();
        savedItem.setUser(watcher);
        savedItem.setProduct(listing);
        savedItemRepository.save(savedItem);

        mockMvc.perform(put("/api/listings/" + listingId)
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload(80.0)))
                .andExpect(status().isOk());

        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(watcher);
        assertEquals(1, notifications.size());
        assertEquals("Price drop", notifications.get(0).getTitle());
        assertEquals(listingId, notifications.get(0).getRelatedListingId());
    }
}
