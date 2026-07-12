package com.app.chasel.model;
import com.app.chasel.model.Users;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "listings")
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    // e.g. "Handbags", "Watches", "Shoes"
    private String category; 

    // Null for trade-only listing
    private Double price; 

    @Column(nullable = false)
    private boolean openToTrade;

    @Column(length = 1000)
    // e.g. "Looking for a Dior Saddle bag, size M"
    private String tradeDescription; 

    @ElementCollection
    private List<String> imageUrls;

    @Column(nullable = false)
    // e.g. "WA", "NY", "CA" - defaults from User, can be changed during listing creation
    private String location; 

    @Enumerated(EnumType.STRING)
    // ACTIVE, SOLD, DRAFT
    private ListingStatus status; 

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private Users seller;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ListingStatus.ACTIVE;
        }
    }

    // getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public boolean isOpenToTrade() {
        return openToTrade;
    }

    public void setOpenToTrade(boolean openToTrade) {
        this.openToTrade = openToTrade;
    }

    public String getTradeDescription() {
        return tradeDescription;
    }

    public void setTradeDescription(String tradeDescription) {
        this.tradeDescription = tradeDescription;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public ListingStatus getStatus() {
        return status;
    }

    public void setStatus(ListingStatus status) {
        this.status = status;
    }

    public Users getSeller() {
        return seller;
    }

    public void setSeller(Users seller) {
        this.seller = seller;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isDraft() {
        return this.status == ListingStatus.DRAFT;
    }

    public boolean isSold() {
        return this.status == ListingStatus.SOLD;
    }

    public boolean isActive() {
        return this.status == ListingStatus.ACTIVE;
    }

    public void markAsSold() {
        this.status = ListingStatus.SOLD;
    }

    public void markAsDraft() {
        this.status = ListingStatus.DRAFT;
    }

    public void markAsActive() {
        this.status = ListingStatus.ACTIVE;
    }

    public boolean isTradeOnly() {
        return this.price == null;
    }

    public boolean isForSale() {
        return this.price != null;
    }

    public boolean isOpenToTradeOnly() {
        return this.openToTrade && this.price == null;
    }

    public boolean isOpenToTradeAndForSale() {
        return this.openToTrade && this.price != null;
    }

    public boolean isNotOpenToTrade() {
        return !this.openToTrade;
    }

    public boolean isNotForSale() {
        return this.price == null;
    }
}