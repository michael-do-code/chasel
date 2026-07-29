package com.app.chasel.controller;

import com.app.chasel.dto.SavedItemResponse;
import com.app.chasel.model.SavedItem;
import com.app.chasel.model.Users;
import com.app.chasel.repository.UserRepository;
import com.app.chasel.service.SavedItemService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saved-items")
public class SavedItemController {

    private final SavedItemService savedItemService;
    private final UserRepository userRepository;

    public SavedItemController(
            SavedItemService savedItemService,
            UserRepository userRepository) {
        this.savedItemService = savedItemService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<SavedItemResponse> getSavedItems(
            Authentication authentication) {

        Long userId = getUserId(authentication);

        return savedItemService.getSavedItems(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/{productId}")
    public SavedItemResponse saveProduct(
            @PathVariable Long productId,
            Authentication authentication) {

        Long userId = getUserId(authentication);

        SavedItem savedItem =
                savedItemService.saveProduct(userId, productId);

        return toResponse(savedItem);
    }

    @DeleteMapping("/{productId}")
    public void removeProduct(
            @PathVariable Long productId,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        savedItemService.removeProduct(userId, productId);
    }

    private Long getUserId(Authentication authentication) {
        Users user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getId();
    }

    private SavedItemResponse toResponse(SavedItem item) {
        return new SavedItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getTitle(),
                item.getProduct().getPrice(),
                item.getProduct().getImageUrls()
        );
    }
}