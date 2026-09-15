package com.app.chasel.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.app.chasel.model.Listing;
import com.app.chasel.model.ListingStatus;
import com.app.chasel.model.Notification;
import com.app.chasel.model.SavedItem;
import com.app.chasel.model.Users;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.SavedItemRepository;
import com.app.chasel.repository.UserRepository;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class NotificationServiceTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private SavedItemRepository savedItemRepository;

    private Users createUser(String emailPrefix) {
        Users user = new Users();
        user.setEmail(emailPrefix + "-" + System.nanoTime() + "@example.com");
        user.setPassword("irrelevant-hash");
        return userRepository.save(user);
    }

    private Listing createListing(Users seller, double price) {
        Listing listing = new Listing();
        listing.setTitle("Test Jacket");
        listing.setBrand("Test Brand");
        listing.setCategory("Clothing");
        listing.setPrice(price);
        listing.setStatus(ListingStatus.ACTIVE);
        listing.setSeller(seller);
        return listingRepository.save(listing);
    }

    private void saveForUser(Users user, Listing listing) {
        SavedItem savedItem = new SavedItem();
        savedItem.setUser(user);
        savedItem.setProduct(listing);
        savedItemRepository.save(savedItem);
    }

    @Test
    void notifyPriceDropCreatesANotificationForEachWatcherExceptTheSeller() {
        Users seller = createUser("seller");
        Listing listing = createListing(seller, 80.0);
        listing.setPreviousPrice(100.0);
        listingRepository.save(listing);

        Users watcherOne = createUser("watcher-one");
        Users watcherTwo = createUser("watcher-two");
        saveForUser(watcherOne, listing);
        saveForUser(watcherTwo, listing);
        saveForUser(seller, listing); // seller also saved their own listing

        notificationService.notifyPriceDrop(listing);

        List<Notification> watcherOneNotifications = notificationService.getNotifications(watcherOne);
        List<Notification> watcherTwoNotifications = notificationService.getNotifications(watcherTwo);
        List<Notification> sellerNotifications = notificationService.getNotifications(seller);

        assertEquals(1, watcherOneNotifications.size());
        assertEquals(1, watcherTwoNotifications.size());
        assertEquals(0, sellerNotifications.size());

        Notification notification = watcherOneNotifications.get(0);
        assertEquals("Price drop", notification.getTitle());
        assertEquals("\"Test Jacket\" dropped from $100.00 to $80.00.", notification.getMessage());
        assertEquals(listing.getId(), notification.getRelatedListingId());
        assertFalse(notification.isRead());
    }

    @Test
    void notifyPriceDropDoesNothingForUsersWhoHaventSavedTheListing() {
        Users seller = createUser("seller");
        Listing listing = createListing(seller, 80.0);
        listing.setPreviousPrice(100.0);
        listingRepository.save(listing);

        Users uninvolvedUser = createUser("uninvolved");

        notificationService.notifyPriceDrop(listing);

        assertTrue(notificationService.getNotifications(uninvolvedUser).isEmpty());
    }

    @Test
    void markAsReadMarksTheCallersOwnNotification() {
        Users seller = createUser("seller");
        Listing listing = createListing(seller, 80.0);
        listing.setPreviousPrice(100.0);
        listingRepository.save(listing);

        Users watcher = createUser("watcher");
        saveForUser(watcher, listing);
        notificationService.notifyPriceDrop(listing);

        Notification notification = notificationService.getNotifications(watcher).get(0);
        assertFalse(notification.isRead());

        notificationService.markAsRead(notification.getId(), watcher);

        Notification reloaded = notificationService.getNotifications(watcher).get(0);
        assertTrue(reloaded.isRead());
    }

    @Test
    void markAsReadRejectsSomeoneElsesNotification() {
        Users seller = createUser("seller");
        Listing listing = createListing(seller, 80.0);
        listing.setPreviousPrice(100.0);
        listingRepository.save(listing);

        Users watcher = createUser("watcher");
        Users stranger = createUser("stranger");
        saveForUser(watcher, listing);
        notificationService.notifyPriceDrop(listing);

        Notification notification = notificationService.getNotifications(watcher).get(0);

        assertThrows(RuntimeException.class, () ->
                notificationService.markAsRead(notification.getId(), stranger));
    }

    @Test
    void markAllAsReadOnlyAffectsTheCallersNotifications() {
        Users seller = createUser("seller");
        Listing listing = createListing(seller, 80.0);
        listing.setPreviousPrice(100.0);
        listingRepository.save(listing);

        Users watcherOne = createUser("watcher-one");
        Users watcherTwo = createUser("watcher-two");
        saveForUser(watcherOne, listing);
        saveForUser(watcherTwo, listing);
        notificationService.notifyPriceDrop(listing);

        notificationService.markAllAsRead(watcherOne);

        assertTrue(notificationService.getNotifications(watcherOne).get(0).isRead());
        assertFalse(notificationService.getNotifications(watcherTwo).get(0).isRead());
    }

    @Test
    void notifyPriceDropWithNoPreviousPriceDoesNotThrowAndCreatesNoNotifications() {
        Users seller = createUser("seller");
        Listing listing = createListing(seller, 80.0);
        // previousPrice is not set, remains null
        listingRepository.save(listing);

        Users watcher = createUser("watcher");
        saveForUser(watcher, listing);

        // Should not throw NullPointerException
        notificationService.notifyPriceDrop(listing);

        // Should create no notifications
        assertTrue(notificationService.getNotifications(watcher).isEmpty());
    }
}
