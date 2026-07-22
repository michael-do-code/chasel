package com.app.chasel.controller;

import com.app.chasel.dto.CreateListingRequest;
import com.app.chasel.model.Listing;
import com.app.chasel.model.ListingStatus;
import com.app.chasel.model.Users;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    public ListingController(ListingRepository listingRepository, UserRepository userRepository) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }

    @GetMapping("/{id}")
    public Listing getListing(@PathVariable Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
    }

    @GetMapping("/mine")
    public List<Listing> getMyListings(Authentication authentication) {
        String email = authentication.getName();
        Users seller = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return listingRepository.findBySellerId(seller.getId());
    }

    @PostMapping
    public Listing createListing(@RequestBody CreateListingRequest request, Authentication authentication) {
        // set by JwtAuthFilter
        String email = authentication.getName(); 
        Users seller = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Listing listing = new Listing();
        listing.setTitle(request.getTitle());
        listing.setBrand(request.getBrand());
        listing.setDescription(request.getDescription());
        listing.setCategory(request.getCategory());
        listing.setSize(request.getSize());
        listing.setCondition(request.getCondition());
        listing.setOriginalRetail(request.getOriginalRetail());
        listing.setPrice(request.getPrice());
        listing.setImageUrls(request.getImageUrls());
        listing.setLocation(request.getLocation() != null ? request.getLocation() : seller.getLocation());
        listing.setSeller(seller);
        listing.setStatus(ListingStatus.ACTIVE);

        return listingRepository.save(listing);
    }

    @PutMapping("/{id}")
    public Listing updateListing(@PathVariable Long id, @RequestBody CreateListingRequest request, Authentication authentication) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        String email = authentication.getName();
        if (!listing.getSeller().getEmail().equals(email)) {
            throw new RuntimeException("Not authorized to edit this listing");
        }

        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setCategory(request.getCategory());
        listing.setPrice(request.getPrice());
        if (request.getImageUrls() != null) {
            listing.setImageUrls(request.getImageUrls());
        }
        if (request.getLocation() != null) {
            listing.setLocation(request.getLocation());
        }

        return listingRepository.save(listing);
    }

    @DeleteMapping("/{id}")
    public void deleteListing(@PathVariable Long id, Authentication authentication) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        String email = authentication.getName();
        if (!listing.getSeller().getEmail().equals(email)) {
            throw new RuntimeException("Not authorized to delete this listing");
        }

        listingRepository.delete(listing);
    }
}