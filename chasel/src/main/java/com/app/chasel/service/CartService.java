package com.app.chasel.service;

import com.app.chasel.model.Cart;
import com.app.chasel.model.CartItem;
import com.app.chasel.model.Listing;
import com.app.chasel.model.Users;
import com.app.chasel.repository.CartItemRepository;
import com.app.chasel.repository.CartRepository;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            UserRepository userRepository,
            ListingRepository listingRepository) {

        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
    }

    @Transactional
    public Cart getOrCreateCart(Long userId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart cart = new Cart();
                    cart.setUser(user);
                    return cartRepository.save(cart);
                });
    }

    @Transactional
    public CartItem addProduct(Long userId, Long productId, int quantity) {
        if (quantity < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be at least 1");
        }

        Listing product = listingRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found"));

        if (product.getSeller().getId().equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot add your own listing to the cart");
        }

        if (!product.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This listing is no longer available: " + product.getTitle());
        }

        Cart cart = getOrCreateCart(userId);

        CartItem item = cartItemRepository.findByCartAndProduct(cart, product)
                .orElseGet(() -> {
                    CartItem created = new CartItem();
                    created.setCart(cart);
                    created.setProduct(product);
                    created.setQuantity(0);
                    return created;
                });

        int requested = item.getQuantity() + quantity;
        if (requested > product.getQuantity()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only " + product.getQuantity() + " available"
                            + (item.getQuantity() > 0 ? " and " + item.getQuantity() + " already in your cart" : ""));
        }

        item.setQuantity(requested);
        return cartItemRepository.save(item);
    }

    @Transactional
    public List<CartItem> getCartItems(Long userId) {
        Cart cart = getOrCreateCart(userId);
        List<CartItem> items = cartItemRepository.findByCart(cart);
        List<CartItem> unavailableItems = items.stream()
                .filter(item -> item.getProduct().getSeller().getId().equals(userId)
                        || !item.getProduct().isActive())
                .toList();

        if (!unavailableItems.isEmpty()) {
            cartItemRepository.deleteAll(unavailableItems);
        }

        return items.stream()
                .filter(item -> !item.getProduct().getSeller().getId().equals(userId)
                        && item.getProduct().isActive())
                .toList();
    }

    /**
     * Total quantity in the member's bag, for the navbar badge.
     *
     * Unlike the other reads this does not create a cart as a side effect —
     * a member who has never added anything simply has a count of zero.
     */
    @Transactional
    public int countItems(Long userId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return cartRepository.findByUser(user)
                .map(cart -> {
                    List<CartItem> items = cartItemRepository.findByCart(cart);
                    List<CartItem> unavailableItems = items.stream()
                            .filter(item -> item.getProduct().getSeller().getId().equals(userId)
                                    || !item.getProduct().isActive())
                            .toList();
                    if (!unavailableItems.isEmpty()) {
                        cartItemRepository.deleteAll(unavailableItems);
                    }
                    return items.stream()
                            .filter(item -> !item.getProduct().getSeller().getId().equals(userId)
                                    && item.getProduct().isActive())
                            .mapToInt(CartItem::getQuantity)
                            .sum();
                })
                .orElse(0);
    }

    @Transactional
    public void removeProduct(Long userId, Long productId) {
        Cart cart = getOrCreateCart(userId);

        Listing product = listingRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        CartItem item = cartItemRepository
                .findByCartAndProduct(cart, product)
                .orElseThrow(() -> new RuntimeException(
                        "Product is not in the cart"
                ));

        cartItemRepository.delete(item);
    }
}
