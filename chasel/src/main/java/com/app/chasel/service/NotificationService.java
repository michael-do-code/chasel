package com.app.chasel.service;

import com.app.chasel.model.Listing;
import com.app.chasel.model.Notification;
import com.app.chasel.model.NotificationType;
import com.app.chasel.model.SavedItem;
import com.app.chasel.model.Users;
import com.app.chasel.repository.NotificationRepository;
import com.app.chasel.repository.SavedItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SavedItemRepository savedItemRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            SavedItemRepository savedItemRepository) {
        this.notificationRepository = notificationRepository;
        this.savedItemRepository = savedItemRepository;
    }

    public void notifyPriceDrop(Listing listing) {
        // Guard: previousPrice is only set when a price drop occurs; safe to call without precondition check
        if (listing.getPreviousPrice() == null) {
            return;
        }

        List<SavedItem> watchers = savedItemRepository.findByProduct(listing);

        for (SavedItem watcher : watchers) {
            Users recipient = watcher.getUser();

            if (recipient.getId().equals(listing.getSeller().getId())) {
                continue;
            }

            Notification notification = new Notification();
            notification.setUser(recipient);
            notification.setType(NotificationType.PRICE_DROP);
            notification.setTitle("Price drop");
            notification.setMessage(buildPriceDropMessage(listing));
            notification.setRelatedListingId(listing.getId());
            notificationRepository.save(notification);
        }
    }

    public List<Notification> getNotifications(Users user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public void markAsRead(Long notificationId, Users user) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to update this notification");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(Users user) {
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    private String buildPriceDropMessage(Listing listing) {
        return "\"%s\" dropped from $%.2f to $%.2f.".formatted(
                listing.getTitle(), listing.getPreviousPrice(), listing.getPrice()
        );
    }
}
