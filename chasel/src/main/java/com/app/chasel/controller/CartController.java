package com.app.chasel.controller;

import com.app.chasel.dto.CartItemResponse;
import com.app.chasel.model.CartItem;
import com.app.chasel.model.Users;
import com.app.chasel.repository.UserRepository;
import com.app.chasel.service.CartService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    public CartController(
            CartService cartService,
            UserRepository userRepository) {
        this.cartService = cartService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<CartItemResponse> getCart(Authentication authentication) {
        Long userId = getUserId(authentication);

        return cartService.getCartItems(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/items/{productId}")
    public CartItemResponse addProduct(
            @PathVariable Long productId,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        CartItem item = cartService.addProduct(userId, productId);

        return toResponse(item);
    }

    @DeleteMapping("/items/{productId}")
    public void removeProduct(
            @PathVariable Long productId,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        cartService.removeProduct(userId, productId);
    }

    private Long getUserId(Authentication authentication) {
        Users user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getId();
    }

    private CartItemResponse toResponse(CartItem item) {
        return new CartItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getTitle(),
                item.getProduct().getPrice(),
                item.getProduct().getImageUrls(),
                item.getQuantity()
        );
    }
}