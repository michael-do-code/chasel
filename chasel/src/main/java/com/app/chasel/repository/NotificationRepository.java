package com.app.chasel.repository;

import com.app.chasel.model.Notification;
import com.app.chasel.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(Users user);

    boolean existsByUserAndTypeAndRelatedOrderId(Users user, String type, Long relatedOrderId);

    boolean existsByUserAndRelatedOrderId(Users user, Long relatedOrderId);

    Optional<Notification> findFirstByUserAndRelatedOrderIdOrderByCreatedAtDesc(
            Users user, Long relatedOrderId);

    Optional<Notification> findFirstByUserAndRelatedOrderIdAndRelatedListingIdOrderByCreatedAtDesc(
            Users user, Long relatedOrderId, Long relatedListingId);

    Optional<Notification> findFirstByUserAndRelatedOrderIdAndRelatedListingIdIsNullOrderByCreatedAtDesc(
            Users user, Long relatedOrderId);
}
