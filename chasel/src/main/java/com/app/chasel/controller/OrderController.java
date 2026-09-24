package com.app.chasel.controller;

import com.app.chasel.dto.CheckoutRequest;
import com.app.chasel.dto.OrderResponse;
import com.app.chasel.model.Users;
import com.app.chasel.repository.UserRepository;
import com.app.chasel.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    @PostMapping("/checkout")
    public OrderResponse checkout(
            @Valid @RequestBody CheckoutRequest request,
            Authentication authentication) {
        return orderService.checkout(
                getUserId(authentication),
                request.shippingAddress());
    }

    @GetMapping("/my-purchases")
    public List<OrderResponse> getPurchases(Authentication authentication) {
        return orderService.getPurchases(getUserId(authentication));
    }

    @GetMapping("/{orderId}")
    public OrderResponse getPurchase(
            @PathVariable Long orderId,
            Authentication authentication) {
        return orderService.getPurchase(getUserId(authentication), orderId);
    }

    private Long getUserId(Authentication authentication) {
        Users user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
        return user.getId();
    }
}
