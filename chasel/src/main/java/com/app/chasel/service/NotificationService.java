package com.app.chasel.service;

import com.app.chasel.model.Listing;
import com.app.chasel.model.Notification;
import com.app.chasel.model.NotificationType;
import com.app.chasel.model.Order;
import com.app.chasel.model.OrderItem;
import com.app.chasel.model.SavedItem;
import com.app.chasel.model.Users;
import com.app.chasel.repository.NotificationRepository;
import com.app.chasel.repository.OrderRepository;
import com.app.chasel.repository.OrderItemRepository;
import com.app.chasel.repository.SavedItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NotificationService {

    private static final Pattern ORDER_NUMBER_PATTERN = Pattern.compile("Order #(\\d+)", Pattern.CASE_INSENSITIVE);

    private final NotificationRepository notificationRepository;
    private final SavedItemRepository savedItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            SavedItemRepository savedItemRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository) {
        this.notificationRepository = notificationRepository;
        this.savedItemRepository = savedItemRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
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

    public synchronized List<Notification> getNotifications(Users user) {
        backfillCurrentOrderNotifications(user);
        backfillSellerOrderNotifications(user);
        return removeDuplicateOrderNotifications(
                notificationRepository.findByUserOrderByCreatedAtDesc(user));
    }

    public synchronized void notifySalePlaced(Order order) {
        order.getItems().stream()
                .map(OrderItem::getSeller)
                .distinct()
                .forEach(seller -> createSalePlacedIfMissing(order, seller));
    }

    /**
     * Older builds could run two notification refreshes concurrently and create
     * the same order milestone twice. Keep the newest copy and remove the rest.
     */
    private List<Notification> removeDuplicateOrderNotifications(List<Notification> notifications) {
        Set<String> seen = new HashSet<>();
        List<Notification> unique = new ArrayList<>();
        List<Notification> duplicates = new ArrayList<>();
        List<Notification> repaired = new ArrayList<>();

        for (Notification notification : notifications) {
            Long orderId = notification.getRelatedOrderId();
            if (orderId == null) {
                Matcher matcher = ORDER_NUMBER_PATTERN.matcher(notification.getMessage());
                if (matcher.find()) {
                    orderId = Long.valueOf(matcher.group(1));
                    notification.setRelatedOrderId(orderId);
                }
            }

            if (orderId == null) {
                unique.add(notification);
                continue;
            }

            String key = orderId + ":" + (notification.getRelatedListingId() == null
                    ? "order"
                    : notification.getRelatedListingId());
            if (seen.add(key)) {
                unique.add(notification);
                if (notification.getRelatedOrderId() != null) repaired.add(notification);
            } else {
                duplicates.add(notification);
            }
        }

        if (!repaired.isEmpty()) {
            notificationRepository.saveAll(repaired);
        }
        if (!duplicates.isEmpty()) {
            notificationRepository.deleteAll(duplicates);
        }
        return unique;
    }

    private void createSalePlacedIfMissing(Order order, Users seller) {
        if (notificationRepository.existsByUserAndRelatedOrderId(seller, order.getId())) return;

        List<OrderItem> sellerItems = order.getItems().stream()
                .filter(item -> item.getSeller().getId().equals(seller.getId()))
                .toList();
        String itemNames = sellerItems.stream().map(OrderItem::getTitleSnapshot).limit(2)
                .reduce((first, second) -> first + ", " + second).orElse("Your item");
        if (sellerItems.size() > 2) itemNames += " and %d more".formatted(sellerItems.size() - 2);

        create(seller, NotificationType.SALE_PLACED, "New sale",
                "Order #%s includes %s. Open Sales to review it.".formatted(order.getOrderNumber(), itemNames),
                sellerItems.isEmpty() ? null : sellerItems.getFirst().getListing().getId(), order.getId());
    }

    private void backfillSellerOrderNotifications(Users seller) {
        orderItemRepository.findBySellerOrderByCreatedAtDesc(seller).forEach(item -> {
            Order order = item.getOrder();
            switch (item.getStatus()) {
                case PLACED -> createSalePlacedIfMissing(order, seller);
                case PROCESSING -> {
                    if (!notificationRepository.existsByUserAndTypeAndRelatedOrderId(
                            seller, NotificationType.SALE_READY.name(), order.getId())) {
                        notifySaleReady(item);
                    }
                }
                case SHIPPED -> {
                    if (!notificationRepository.existsByUserAndTypeAndRelatedOrderId(
                            seller, NotificationType.SALE_SHIPPED.name(), order.getId())) {
                        notifySaleShipped(item);
                    }
                }
                case DELIVERED -> {
                    if (!notificationRepository.existsByUserAndTypeAndRelatedOrderId(
                            seller, NotificationType.SALE_DELIVERED.name(), order.getId())) {
                        create(
                                seller,
                                NotificationType.SALE_DELIVERED,
                                "Sale completed",
                                "Order #%s was delivered to the buyer.".formatted(order.getOrderNumber()),
                                item.getListing().getId(),
                                order.getId());
                    }
                }
                case CANCELLED -> {
                    if (!notificationRepository.existsByUserAndTypeAndRelatedOrderId(
                            seller, NotificationType.SALE_CANCELLED.name(), order.getId())) {
                        notifySaleCancelled(item);
                    }
                }
            }
        });
    }

    /** Adds the latest missing milestone for orders created before milestone notifications existed. */
    private void backfillCurrentOrderNotifications(Users user) {
        orderRepository.findByBuyerOrderByCreatedAtDesc(user).forEach(order -> {
            NotificationType type = switch (order.getStatus()) {
                case PLACED -> NotificationType.ORDER_PLACED;
                case PROCESSING -> NotificationType.ORDER_PROCESSING;
                case SHIPPED -> NotificationType.ORDER_SHIPPED;
                case DELIVERED -> NotificationType.ORDER_DELIVERED;
                case CANCELLED -> NotificationType.ORDER_CANCELLED;
            };

            if (notificationRepository.existsByUserAndRelatedOrderId(user, order.getId())) {
                return;
            }

            String title = switch (type) {
                case ORDER_PLACED -> "Order placed";
                case ORDER_PROCESSING -> "Order processing";
                case ORDER_SHIPPED -> "Order shipped";
                case ORDER_DELIVERED -> "Delivery confirmed";
                case ORDER_CANCELLED -> "Order cancelled";
                default -> "Order update";
            };
            String message = switch (type) {
                case ORDER_PLACED -> "Order #%s was placed and is awaiting preparation.".formatted(order.getOrderNumber());
                case ORDER_PROCESSING -> "Order #%s is being prepared for shipment.".formatted(order.getOrderNumber());
                case ORDER_SHIPPED -> "Order #%s is on the way.".formatted(order.getOrderNumber());
                case ORDER_DELIVERED -> "Order #%s was delivered.".formatted(order.getOrderNumber());
                case ORDER_CANCELLED -> "Order #%s was cancelled.".formatted(order.getOrderNumber());
                default -> "Order #%s was updated.".formatted(order.getOrderNumber());
            };
            create(user, type, title, message, null, order.getId());
        });
    }

    public void notifyOrderPlaced(Order order) {
        create(
                order.getBuyer(),
                NotificationType.ORDER_PLACED,
                "Order placed",
                "Order #%s was placed. You may cancel it before %s."
                        .formatted(order.getOrderNumber(), order.getCancelUntil()),
                null,
                order.getId());
    }

    public void notifyOrderCancelled(Order order) {
        create(
                order.getBuyer(),
                NotificationType.ORDER_CANCELLED,
                "Order cancelled",
                "Order #%s was cancelled and its items were returned to the marketplace."
                        .formatted(order.getOrderNumber()),
                null,
                order.getId());

        order.getItems().stream()
                .map(OrderItem::getSeller)
                .distinct()
                .forEach(seller -> {
                    OrderItem sellerItem = order.getItems().stream()
                            .filter(item -> item.getSeller().getId().equals(seller.getId()))
                            .findFirst()
                            .orElse(null);
                    create(
                            seller,
                            NotificationType.SALE_CANCELLED,
                            "Sale cancelled",
                            "The buyer cancelled order #%s. The item is available for sale again."
                                    .formatted(order.getOrderNumber()),
                            sellerItem == null ? null : sellerItem.getListing().getId(),
                            order.getId());
                });
    }

    private void notifySaleCancelled(OrderItem item) {
        create(
                item.getSeller(),
                NotificationType.SALE_CANCELLED,
                "Sale cancelled",
                "The buyer cancelled order #%s. The item is available for sale again."
                        .formatted(item.getOrder().getOrderNumber()),
                item.getListing().getId(),
                item.getOrder().getId());
    }

    public void notifyOrderProcessing(Order order) {
        create(
                order.getBuyer(),
                NotificationType.ORDER_PROCESSING,
                "Order processing",
                "Order #%s is now being prepared for shipment. It can no longer be cancelled."
                        .formatted(order.getOrderNumber()),
                null,
                order.getId());
    }

    public void notifyOrderItemProcessing(OrderItem item) {
        create(
                item.getOrder().getBuyer(),
                NotificationType.ORDER_PROCESSING,
                "Item being prepared",
                "%s from order #%s is being prepared by %s."
                        .formatted(item.getTitleSnapshot(), item.getOrder().getOrderNumber(),
                                displayName(item.getSeller())),
                item.getListing().getId(),
                item.getOrder().getId());
    }

    public void notifySaleReady(OrderItem item) {
        create(
                item.getSeller(),
                NotificationType.SALE_READY,
                "Sale ready to ship",
                "Order #%s: %s is ready to ship. Open Sales to view the fulfillment code."
                        .formatted(item.getOrder().getOrderNumber(), item.getTitleSnapshot()),
                item.getListing().getId(),
                item.getOrder().getId());
    }

    public void notifyOrderShipped(OrderItem item) {
        create(
                item.getOrder().getBuyer(),
                NotificationType.ORDER_SHIPPED,
                "Order shipped",
                "%s from order #%s has been marked as shipped."
                        .formatted(item.getTitleSnapshot(), item.getOrder().getOrderNumber()),
                item.getListing().getId(),
                item.getOrder().getId());
    }

    public void notifySaleShipped(OrderItem item) {
        create(
                item.getSeller(),
                NotificationType.SALE_SHIPPED,
                "Sale shipped",
                "Order #%s: %s was marked as shipped."
                        .formatted(item.getOrder().getOrderNumber(), item.getTitleSnapshot()),
                item.getListing().getId(),
                item.getOrder().getId());
    }

    public void notifyOrderDelivered(Order order) {
        create(
                order.getBuyer(),
                NotificationType.ORDER_DELIVERED,
                "Delivery confirmed",
                "Order #%s was confirmed as delivered. Thank you for shopping with Chasel."
                        .formatted(order.getOrderNumber()),
                null,
                order.getId());

        order.getItems().stream()
                .map(OrderItem::getSeller)
                .distinct()
                .forEach(seller -> create(
                        seller,
                        NotificationType.SALE_DELIVERED,
                        "Delivery confirmed",
                        "The buyer confirmed delivery for order #%s."
                                .formatted(order.getOrderNumber()),
                        null,
                        order.getId()));
    }

    public void notifyReturnRequested(OrderItem item) {
        create(
                item.getSeller(),
                NotificationType.SALE_RETURN_REQUESTED,
                "Return requested",
                "The buyer requested a return for %s from order #%s."
                        .formatted(item.getTitleSnapshot(), item.getOrder().getOrderNumber()),
                item.getListing().getId(),
                item.getOrder().getId());
    }

    public void notifyReturnApproved(OrderItem item) {
        create(item.getOrder().getBuyer(), NotificationType.ORDER_RETURN_APPROVED,
                "Return approved",
                "Your return for %s from order #%s was approved. Your return label is ready."
                        .formatted(item.getTitleSnapshot(), item.getOrder().getOrderNumber()),
                item.getListing().getId(), item.getOrder().getId());
    }

    public void notifyReturnDiscussion(OrderItem item) {
        create(item.getOrder().getBuyer(), NotificationType.ORDER_RETURN_DISCUSSION,
                "Seller sent a return update",
                "The seller would like to talk before approving the return for %s from order #%s."
                        .formatted(item.getTitleSnapshot(), item.getOrder().getOrderNumber()),
                item.getListing().getId(), item.getOrder().getId());
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

    private synchronized void create(
            Users recipient,
            NotificationType type,
            String title,
            String message,
            Long relatedListingId,
            Long relatedOrderId) {
        Notification notification;
        if (relatedOrderId == null) {
            notification = new Notification();
        } else if (relatedListingId == null) {
            notification = notificationRepository
                    .findFirstByUserAndRelatedOrderIdAndRelatedListingIdIsNullOrderByCreatedAtDesc(
                            recipient, relatedOrderId)
                    .orElseGet(Notification::new);
        } else {
            notification = notificationRepository
                    .findFirstByUserAndRelatedOrderIdAndRelatedListingIdOrderByCreatedAtDesc(
                            recipient, relatedOrderId, relatedListingId)
                    .orElseGet(Notification::new);
        }
        notification.setUser(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedListingId(relatedListingId);
        notification.setRelatedOrderId(relatedOrderId);
        notification.setRead(false);
        notification.touch();
        notificationRepository.save(notification);
    }

    private String displayName(Users user) {
        String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isBlank() ? "the seller" : name;
    }
}
