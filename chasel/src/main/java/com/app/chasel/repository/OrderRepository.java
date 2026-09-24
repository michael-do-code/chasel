package com.app.chasel.repository;

import com.app.chasel.model.Order;
import com.app.chasel.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @EntityGraph(attributePaths = {"items", "items.listing", "items.seller"})
    List<Order> findByBuyerOrderByCreatedAtDesc(Users buyer);

    @EntityGraph(attributePaths = {"items", "items.listing", "items.seller"})
    java.util.Optional<Order> findByIdAndBuyer(Long id, Users buyer);
}
