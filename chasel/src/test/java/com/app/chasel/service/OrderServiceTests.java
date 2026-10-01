package com.app.chasel.service;

import com.app.chasel.dto.OrderResponse;
import com.app.chasel.dto.SaleItemResponse;
import com.app.chasel.model.Cart;
import com.app.chasel.model.CartItem;
import com.app.chasel.model.Listing;
import com.app.chasel.model.ListingStatus;
import com.app.chasel.model.Order;
import com.app.chasel.model.OrderItemStatus;
import com.app.chasel.model.OrderStatus;
import com.app.chasel.model.Users;
import com.app.chasel.repository.CartItemRepository;
import com.app.chasel.repository.CartRepository;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.OrderRepository;
import com.app.chasel.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class OrderServiceTests {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private CartRepository cartRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private ListingRepository listingRepository;
    @Autowired private UserRepository userRepository;

    @Test
    void checkoutCreatesOrderAndBuyerCanCancelDuringWindow() {
        Users buyer = userRepository.save(user("buyer-order-test@example.com", "Buyer"));
        Users seller = userRepository.save(user("seller-order-test@example.com", "Seller"));
        Listing listing = listingRepository.save(listing(seller));

        Cart cart = new Cart();
        cart.setUser(buyer);
        cart = cartRepository.save(cart);

        CartItem cartItem = new CartItem();
        cartItem.setCart(cart);
        cartItem.setProduct(listing);
        cartItem.setQuantity(1);
        cartItemRepository.save(cartItem);

        OrderResponse response = orderService.checkout(buyer.getId(), "123 Main St", null);

        assertThat(response.cancellable()).isTrue();
        assertThat(response.cancelUntil()).isAfter(LocalDateTime.now().plusMinutes(29));
        assertThat(response.cancelUntil()).isBefore(LocalDateTime.now().plusMinutes(31));
        assertThat(response.taxAmount()).isEqualByComparingTo(new BigDecimal("12.55"));
        assertThat(response.deliveryAmount()).isEqualByComparingTo(new BigDecimal("9.95"));
        assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("148.00"));
        assertThat(response.shippingAddress()).isEqualTo("123 Main St");
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().getFirst().sellerId()).isEqualTo(seller.getId());
        assertThat(response.items().getFirst().title()).isEqualTo("Leather Bag");
        assertThat(orderRepository.findByBuyerOrderByCreatedAtDesc(buyer)).hasSize(1);
        assertThat(cartItemRepository.findByCart(cart)).isEmpty();
        assertThat(listingRepository.findById(listing.getId()).orElseThrow().getStatus())
                .isEqualTo(ListingStatus.SOLD);

        OrderResponse cancelled = orderService.cancelOrder(buyer.getId(), response.id());

        assertThat(cancelled.status()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(cancelled.cancelledAt()).isNotNull();
        assertThat(cancelled.cancellable()).isFalse();
        assertThat(cancelled.items()).allMatch(
                item -> item.status() == OrderItemStatus.CANCELLED);
        assertThat(listingRepository.findById(listing.getId()).orElseThrow().getStatus())
                .isEqualTo(ListingStatus.ACTIVE);
    }

    @Test
    void cancellationIsRejectedAfterDeadline() {
        Users buyer = userRepository.save(user("late-buyer@example.com", "Buyer"));
        Users seller = userRepository.save(user("late-seller@example.com", "Seller"));
        Listing listing = listingRepository.save(listing(seller));

        Cart cart = new Cart();
        cart.setUser(buyer);
        cart = cartRepository.save(cart);

        CartItem cartItem = new CartItem();
        cartItem.setCart(cart);
        cartItem.setProduct(listing);
        cartItem.setQuantity(1);
        cartItemRepository.save(cartItem);

        OrderResponse response = orderService.checkout(buyer.getId(), "123 Main St", null);
        Order order = orderRepository.findById(response.id()).orElseThrow();
        order.setCancelUntil(LocalDateTime.now().minusSeconds(1));
        orderRepository.saveAndFlush(order);

        assertThatThrownBy(() -> orderService.cancelOrder(buyer.getId(), order.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("cancellation period");
        assertThat(listingRepository.findById(listing.getId()).orElseThrow().getStatus())
                .isEqualTo(ListingStatus.SOLD);

        orderService.processExpiredOrders();

        Order processed = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(processed.getStatus()).isEqualTo(OrderStatus.PROCESSING);
        assertThat(processed.getProcessingAt()).isNotNull();

        List<SaleItemResponse> sales = orderService.getSales(seller.getId());
        assertThat(sales).hasSize(1);
        assertThat(sales.getFirst().status()).isEqualTo(OrderItemStatus.PROCESSING);
        assertThat(sales.getFirst().shippingCode()).isNotBlank();

        SaleItemResponse shipped = orderService.markShipped(
                seller.getId(), sales.getFirst().itemId());
        assertThat(shipped.status()).isEqualTo(OrderItemStatus.SHIPPED);
        assertThat(shipped.shippedAt()).isNotNull();
        assertThat(orderRepository.findById(order.getId()).orElseThrow().getStatus())
                .isEqualTo(OrderStatus.SHIPPED);

        OrderResponse delivered = orderService.confirmDelivered(buyer.getId(), order.getId());
        assertThat(delivered.status()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(delivered.items()).allMatch(
                item -> item.status() == OrderItemStatus.DELIVERED);
    }

    private Users user(String email, String firstName) {
        Users user = new Users();
        user.setEmail(email);
        user.setPassword("test-password");
        user.setFirstName(firstName);
        user.setLastName("User");
        return user;
    }

    private Listing listing(Users seller) {
        Listing listing = new Listing();
        listing.setSeller(seller);
        listing.setTitle("Leather Bag");
        listing.setBrand("Test Brand");
        listing.setCategory("Handbags");
        listing.setPrice(125.50);
        listing.setStatus(ListingStatus.ACTIVE);
        listing.setImageUrls(List.of());
        return listing;
    }
}
