package com.app.chasel.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import com.app.chasel.model.Listing;
import com.app.chasel.model.ListingStatus;
import com.app.chasel.model.Notification;
import com.app.chasel.model.NotificationType;
import com.app.chasel.model.Users;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.NotificationRepository;
import com.app.chasel.repository.UserRepository;
import com.app.chasel.security.JwtUtil;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private Users seller;
    private Listing listing;
    private String watcherToken;
    private Notification watcherNotification;

    @BeforeEach
    void seedData() {
        seller = new Users();
        seller.setEmail("seller-" + System.nanoTime() + "@example.com");
        seller.setPassword("irrelevant-hash");
        seller = userRepository.save(seller);

        listing = new Listing();
        listing.setTitle("Test Jacket");
        listing.setBrand("Test Brand");
        listing.setCategory("Clothing");
        listing.setPrice(80.0);
        listing.setPreviousPrice(100.0);
        listing.setStatus(ListingStatus.ACTIVE);
        listing.setSeller(seller);
        listing = listingRepository.save(listing);

        Users watcher = new Users();
        watcher.setEmail("watcher-" + System.nanoTime() + "@example.com");
        watcher.setPassword("irrelevant-hash");
        watcher = userRepository.save(watcher);
        watcherToken = jwtUtil.generateToken(watcher.getEmail());

        watcherNotification = new Notification();
        watcherNotification.setUser(watcher);
        watcherNotification.setType(NotificationType.PRICE_DROP);
        watcherNotification.setTitle("Price drop");
        watcherNotification.setMessage("\"Test Jacket\" dropped from $100.00 to $80.00.");
        watcherNotification.setRelatedListingId(listing.getId());
        watcherNotification = notificationRepository.save(watcherNotification);
    }

    @Test
    void getNotificationsReturnsOnlyTheCallersOwn() throws Exception {
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + watcherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Price drop"))
                .andExpect(jsonPath("$[0].relatedListingId").value(listing.getId()))
                .andExpect(jsonPath("$[0].read").value(false));
    }

    @Test
    void anonymousCannotListNotifications() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isForbidden());
    }

    @Test
    void markAsReadPersists() throws Exception {
        mockMvc.perform(patch("/api/notifications/" + watcherNotification.getId() + "/read")
                        .header("Authorization", "Bearer " + watcherToken))
                .andExpect(status().isOk());

        Notification reloaded = notificationRepository.findById(watcherNotification.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(reloaded.isRead());
    }

    @Test
    void markAllAsReadPersists() throws Exception {
        mockMvc.perform(patch("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + watcherToken))
                .andExpect(status().isOk());

        Notification reloaded = notificationRepository.findById(watcherNotification.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(reloaded.isRead());
    }
}
