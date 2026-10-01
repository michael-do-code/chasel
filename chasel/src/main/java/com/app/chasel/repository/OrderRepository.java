package com.app.chasel.repository;

import com.app.chasel.model.Order;
import com.app.chasel.model.Users;
import com.app.chasel.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    boolean existsByOrderNumber(String orderNumber);
    @EntityGraph(attributePaths = {"items", "items.listing", "items.seller"})
    List<Order> findByBuyerOrderByCreatedAtDesc(Users buyer);

    @EntityGraph(attributePaths = {"items", "items.listing", "items.seller"})
    Optional<Order> findByIdAndBuyer(Long id, Users buyer);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"items", "items.listing", "items.seller"})
    @Query("select o from Order o where o.id = :id and o.buyer = :buyer")
    Optional<Order> findForCancellation(
            @Param("id") Long id,
            @Param("buyer") Users buyer);

    @EntityGraph(attributePaths = {"buyer", "items", "items.listing", "items.seller"})
    List<Order> findByStatusAndCancelUntilLessThanEqual(
            OrderStatus status,
            java.time.LocalDateTime deadline);
}
