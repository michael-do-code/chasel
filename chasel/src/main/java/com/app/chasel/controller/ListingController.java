package com.app.chasel.controller;

import com.app.chasel.dto.CreateListingRequest;
import com.app.chasel.model.Listing;
import com.app.chasel.model.ListingStatus;
import com.app.chasel.model.Users;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.CartItemRepository;
import com.app.chasel.repository.ProductImageRepository;
import com.app.chasel.repository.SavedItemRepository;
import com.app.chasel.repository.UserRepository;
import com.app.chasel.service.NotificationService;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final SavedItemRepository savedItemRepository;
    private final ProductImageRepository productImageRepository;
    private final NotificationService notificationService;

    public ListingController(
            ListingRepository listingRepository,
            UserRepository userRepository,
            CartItemRepository cartItemRepository,
            SavedItemRepository savedItemRepository,
            ProductImageRepository productImageRepository,
            NotificationService notificationService) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.cartItemRepository = cartItemRepository;
        this.savedItemRepository = savedItemRepository;
        this.productImageRepository = productImageRepository;
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<Listing> getAllListings() {
        // A newly purchased piece remains visible as SOLD while the buyer can
        // still cancel. It disappears when the order advances to PROCESSING;
        // cancellation makes the listing ACTIVE and purchasable again.
        return listingRepository.findMarketplaceListings();
    }

    @GetMapping("/trending")
    public List<Listing> getTrendingListings() {
        return listingRepository.findTrendingBySaveCount();
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

    // A seller's public storefront: only pieces that are currently for sale.
    @GetMapping("/seller/{sellerId}")
    public List<Listing> getSellerListings(@PathVariable Long sellerId) {
        return listingRepository.findBySellerIdAndStatusOrderByCreatedAtDesc(sellerId, ListingStatus.ACTIVE);
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
        listing.setLocation(request.getLocation() != null ? request.getLocation() : seller.getState());
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
        listing.setBrand(request.getBrand());
        listing.setDescription(request.getDescription());
        listing.setCategory(request.getCategory());
        listing.setSize(request.getSize());
        listing.setCondition(request.getCondition());
        listing.setOriginalRetail(request.getOriginalRetail());

        // A markdown is always measured from the first asking price, not from
        // the immediately preceding edit. Thus 100 -> 80 -> 90 remains reduced
        // from 100. Existing rows are migrated lazily using the best baseline
        // they already contain.
        double currentPrice = listing.getPrice();
        Double initialPrice = listing.getInitialPrice();
        if (initialPrice == null) {
            initialPrice = listing.getPreviousPrice() != null
                    ? Math.max(listing.getPreviousPrice(), currentPrice)
                    : currentPrice;
            listing.setInitialPrice(initialPrice);
        }

        boolean isDiscounted = request.getPrice() < initialPrice;
        boolean priceDroppedFurther = request.getPrice() < currentPrice;
        listing.setPreviousPrice(isDiscounted ? initialPrice : null);
        listing.setPrice(request.getPrice());

        if (request.getImageUrls() != null) {
            listing.setImageUrls(request.getImageUrls());
        }
        if (request.getLocation() != null) {
            listing.setLocation(request.getLocation());
        }

        Listing saved = listingRepository.save(listing);

        if (isDiscounted && priceDroppedFurther) {
            notificationService.notifyPriceDrop(saved);
        }

        return saved;
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void deleteListing(@PathVariable Long id, Authentication authentication) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        String email = authentication.getName();
        if (!listing.getSeller().getEmail().equals(email)) {
            throw new RuntimeException("Not authorized to delete this listing");
        }

        cartItemRepository.deleteByProduct(listing);
        savedItemRepository.deleteByProduct(listing);
        productImageRepository.deleteByProduct(listing);
        listingRepository.delete(listing);
    }
}
