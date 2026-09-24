package com.app.chasel.repository;

import com.app.chasel.model.OrderItem;
import com.app.chasel.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findBySellerOrderByCreatedAtDesc(Users seller);
}
