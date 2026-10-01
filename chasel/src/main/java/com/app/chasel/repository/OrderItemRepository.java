package com.app.chasel.repository;

import com.app.chasel.model.OrderItem;
import com.app.chasel.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    @EntityGraph(attributePaths = {"order", "order.buyer", "listing", "seller"})
    List<OrderItem> findBySellerOrderByCreatedAtDesc(Users seller);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"order", "order.items", "order.buyer", "listing", "seller"})
    @Query("select item from OrderItem item where item.id = :id and item.seller = :seller")
    Optional<OrderItem> findForSellerUpdate(
            @Param("id") Long id,
            @Param("seller") Users seller);
}
