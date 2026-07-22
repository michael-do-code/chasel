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
    // e.g. "The Row", "Celine", "Hermes"
    private String brand;

    @Column(nullable = false)
    // e.g. "Handbags", "Watches", "Shoes"
    private String category;

    // e.g. "M", "32", "42"
    private String size;

    // e.g. "Excellent", "Very Good", "Good"
    private String condition;

    // Original retail price before discount
    private Double originalRetail;

    @Column(nullable = false)
    // Price is always required (no trade-only listings)
    private Double price; 

    @ElementCollection
    private List<String> imageUrls;

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

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
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

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public Double getOriginalRetail() {
        return originalRetail;
    }

    public void setOriginalRetail(Double originalRetail) {
        this.originalRetail = originalRetail;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
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

    public boolean isForSale() {
        return this.price != null;
    }
}