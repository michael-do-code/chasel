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
import org.springframework.stereotype.Service;

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
    public CartItem addProduct(Long userId, Long productId) {
        Cart cart = getOrCreateCart(userId);

        Listing product = listingRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        return cartItemRepository.findByCartAndProduct(cart, product)
                .orElseGet(() -> {
                    CartItem item = new CartItem();
                    item.setCart(cart);
                    item.setProduct(product);
                    item.setQuantity(1);
                    return cartItemRepository.save(item);
                });
    }

    public List<CartItem> getCartItems(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return cartItemRepository.findByCart(cart);
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