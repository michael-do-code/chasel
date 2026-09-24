package com.app.chasel.service;

import com.app.chasel.dto.OrderResponse;
import com.app.chasel.model.Cart;
import com.app.chasel.model.CartItem;
import com.app.chasel.model.Listing;
import com.app.chasel.model.ListingStatus;
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

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

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
    void checkoutCreatesOrderSnapshotsAndClearsCart() {
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

        OrderResponse response = orderService.checkout(buyer.getId(), "123 Main St");

        assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("125.50"));
        assertThat(response.shippingAddress()).isEqualTo("123 Main St");
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().getFirst().sellerId()).isEqualTo(seller.getId());
        assertThat(response.items().getFirst().title()).isEqualTo("Leather Bag");
        assertThat(orderRepository.findByBuyerOrderByCreatedAtDesc(buyer)).hasSize(1);
        assertThat(cartItemRepository.findByCart(cart)).isEmpty();
        assertThat(listingRepository.findById(listing.getId()).orElseThrow().getStatus())
                .isEqualTo(ListingStatus.SOLD);
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
