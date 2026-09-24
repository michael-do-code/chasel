package com.app.chasel.service;

import com.app.chasel.dto.OrderItemResponse;
import com.app.chasel.dto.OrderResponse;
import com.app.chasel.model.Cart;
import com.app.chasel.model.CartItem;
import com.app.chasel.model.Listing;
import com.app.chasel.model.Order;
import com.app.chasel.model.OrderItem;
import com.app.chasel.model.Users;
import com.app.chasel.repository.CartItemRepository;
import com.app.chasel.repository.CartRepository;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.OrderRepository;
import com.app.chasel.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    public OrderService(
            OrderRepository orderRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ListingRepository listingRepository,
            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderResponse checkout(Long buyerId, String shippingAddress) {
        Users buyer = getUser(buyerId);
        Cart cart = cartRepository.findByUser(buyer)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Cart is empty"));

        List<CartItem> cartItems = cartItemRepository.findByCart(cart);
        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        Order order = new Order();
        order.setBuyer(buyer);
        order.setShippingAddress(shippingAddress.trim());

        BigDecimal total = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            Listing listing = listingRepository.findByIdForUpdate(
                            cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Listing not found"));

            if (!listing.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Listing is no longer available: " + listing.getTitle());
            }

            if (listing.getSeller().getId().equals(buyerId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "You cannot buy your own listing: " + listing.getTitle());
            }

            int quantity = cartItem.getQuantity();
            BigDecimal unitPrice = BigDecimal.valueOf(listing.getPrice());

            OrderItem orderItem = new OrderItem();
            orderItem.setListing(listing);
            orderItem.setSeller(listing.getSeller());
            orderItem.setTitleSnapshot(listing.getTitle());
            orderItem.setPriceSnapshot(unitPrice);
            orderItem.setQuantity(quantity);
            order.addItem(orderItem);

            total = total.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));
            listing.markAsSold();
        }

        order.setTotalAmount(total);
        Order savedOrder = orderRepository.save(order);

        // Only clear the cart after every order item has been created successfully.
        cartItemRepository.deleteAll(cartItems);

        return toResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getPurchases(Long buyerId) {
        Users buyer = getUser(buyerId);
        return orderRepository.findByBuyerOrderByCreatedAtDesc(buyer)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getPurchase(Long buyerId, Long orderId) {
        Users buyer = getUser(buyerId);
        Order order = orderRepository.findByIdAndBuyer(orderId, buyer)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Order not found"));
        return toResponse(order);
    }

    private Users getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getId(),
                        item.getListing().getId(),
                        item.getSeller().getId(),
                        sellerName(item.getSeller()),
                        item.getTitleSnapshot(),
                        item.getPriceSnapshot(),
                        item.getQuantity(),
                        item.getStatus(),
                        item.getListing().getImageUrls()
                ))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getBuyer().getId(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getShippingAddress(),
                order.getCreatedAt(),
                items
        );
    }

    private String sellerName(Users seller) {
        String firstName = seller.getFirstName() == null ? "" : seller.getFirstName();
        String lastName = seller.getLastName() == null ? "" : seller.getLastName();
        String fullName = (firstName + " " + lastName).trim();
        return fullName.isEmpty() ? "Seller" : fullName;
    }
}
