package com.app.chasel.service;

import com.app.chasel.dto.OrderResponse;
import com.app.chasel.model.Listing;
import com.app.chasel.model.ListingStatus;
import com.app.chasel.model.Users;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** A listing's quantity caps the cart, drops on checkout, and returns on cancel. */
@SpringBootTest
@Transactional
class ListingStockTests {

    @Autowired private CartService cartService;
    @Autowired private OrderService orderService;
    @Autowired private ListingRepository listingRepository;
    @Autowired private UserRepository userRepository;

    private Users buyer;
    private Listing listing;

    @BeforeEach
    void seed() {
        buyer = userRepository.save(user("stock-buyer-" + System.nanoTime() + "@example.com"));
        Users seller = userRepository.save(user("stock-seller-" + System.nanoTime() + "@example.com"));

        listing = new Listing();
        listing.setSeller(seller);
        listing.setTitle("Linen Shirt");
        listing.setBrand("Test Brand");
        listing.setCategory("Clothing");
        listing.setPrice(40.0);
        listing.setQuantity(3);
        listing.setStatus(ListingStatus.ACTIVE);
        listing.setImageUrls(List.of());
        listing = listingRepository.save(listing);
    }

    @Test
    void cartAccumulatesUpToStock() {
        assertThat(cartService.addProduct(buyer.getId(), listing.getId(), 2).getQuantity()).isEqualTo(2);
        assertThat(cartService.addProduct(buyer.getId(), listing.getId(), 1).getQuantity()).isEqualTo(3);

        assertThatThrownBy(() -> cartService.addProduct(buyer.getId(), listing.getId(), 1))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> assertThat(((ResponseStatusException) error).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void cartRejectsNonPositiveQuantity() {
        assertThatThrownBy(() -> cartService.addProduct(buyer.getId(), listing.getId(), 0))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void checkoutTakesStockAndCancelReturnsIt() {
        cartService.addProduct(buyer.getId(), listing.getId(), 2);
        OrderResponse order = orderService.checkout(buyer.getId(), "123 Main St", null);

        Listing afterCheckout = listingRepository.findById(listing.getId()).orElseThrow();
        assertThat(afterCheckout.getQuantity()).isEqualTo(1);
        assertThat(afterCheckout.getStatus()).isEqualTo(ListingStatus.ACTIVE);

        orderService.cancelOrder(buyer.getId(), order.id());
        assertThat(listingRepository.findById(listing.getId()).orElseThrow().getQuantity()).isEqualTo(3);
    }

    @Test
    void buyingTheLastUnitsMarksListingSold() {
        cartService.addProduct(buyer.getId(), listing.getId(), 3);
        orderService.checkout(buyer.getId(), "123 Main St", null);

        Listing soldOut = listingRepository.findById(listing.getId()).orElseThrow();
        assertThat(soldOut.getQuantity()).isZero();
        assertThat(soldOut.getStatus()).isEqualTo(ListingStatus.SOLD);
    }

    @Test
    void legacyListingWithoutQuantityIsASinglePiece() {
        Listing legacy = listingRepository.findById(listing.getId()).orElseThrow();
        legacy.setQuantity(null);
        assertThat(legacy.getQuantity()).isEqualTo(1);
        legacy.markAsSold();
        assertThat(legacy.getQuantity()).isZero();
    }

    private static Users user(String email) {
        Users user = new Users();
        user.setEmail(email);
        user.setPassword("test-password");
        user.setFirstName("Stock");
        user.setLastName("Tester");
        return user;
    }
}
