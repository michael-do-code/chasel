package com.app.chasel.controller;

import com.app.chasel.dto.NotificationResponse;
import com.app.chasel.model.Notification;
import com.app.chasel.model.Users;
import com.app.chasel.repository.UserRepository;
import com.app.chasel.repository.OrderRepository;
import com.app.chasel.service.NotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public NotificationController(
            NotificationService notificationService,
            UserRepository userRepository,
            OrderRepository orderRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public List<NotificationResponse> getNotifications(Authentication authentication) {
        Users user = getUser(authentication);
        return notificationService.getNotifications(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PatchMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id, Authentication authentication) {
        Users user = getUser(authentication);
        notificationService.markAsRead(id, user);
    }

    @PatchMapping("/read-all")
    public void markAllAsRead(Authentication authentication) {
        Users user = getUser(authentication);
        notificationService.markAllAsRead(user);
    }

    private Users getUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType().name(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getRelatedListingId(),
                notification.getRelatedOrderId(),
                notification.getRelatedOrderId() == null ? null : orderRepository
                        .findById(notification.getRelatedOrderId())
                        .map(order -> order.getOrderNumber())
                        .orElse(null),
                notification.getRelatedOrderId() == null ? null : orderRepository
                        .findById(notification.getRelatedOrderId())
                        .map(order -> order.getStatus().name())
                        .orElse(null),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
