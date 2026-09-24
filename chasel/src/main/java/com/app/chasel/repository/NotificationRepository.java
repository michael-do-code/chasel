package com.app.chasel.repository;

import com.app.chasel.model.Notification;
import com.app.chasel.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(Users user);
}
