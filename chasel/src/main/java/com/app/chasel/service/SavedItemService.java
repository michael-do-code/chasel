package com.app.chasel.service;

import com.app.chasel.model.Listing;
import com.app.chasel.model.SavedItem;
import com.app.chasel.model.Users;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.SavedItemRepository;
import com.app.chasel.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SavedItemService {

    private final SavedItemRepository savedItemRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    public SavedItemService(
            SavedItemRepository savedItemRepository,
            UserRepository userRepository,
            ListingRepository listingRepository) {

        this.savedItemRepository = savedItemRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
    }

    public List<SavedItem> getSavedItems(Long userId) {
        Users user = getUser(userId);
        return savedItemRepository.findByUser(user);
    }

    @Transactional
    public SavedItem saveProduct(Long userId, Long productId) {
        Users user = getUser(userId);
        Listing product = getProduct(productId);

        return savedItemRepository
                .findByUserAndProduct(user, product)
                .orElseGet(() -> {
                    SavedItem savedItem = new SavedItem();
                    savedItem.setUser(user);
                    savedItem.setProduct(product);
                    return savedItemRepository.save(savedItem);
                });
    }

    @Transactional
    public void removeProduct(Long userId, Long productId) {
        Users user = getUser(userId);
        Listing product = getProduct(productId);

        SavedItem savedItem = savedItemRepository
                .findByUserAndProduct(user, product)
                .orElseThrow(() ->
                        new RuntimeException("Product is not saved"));

        savedItemRepository.delete(savedItem);
    }

    private Users getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Listing getProduct(Long productId) {
        return listingRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }
}