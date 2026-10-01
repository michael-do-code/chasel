package com.app.chasel.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.OrderColumn;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private Users seller;

    /** Product details are copied at checkout so order history cannot change. */
    @Column(nullable = false)
    private String titleSnapshot;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal priceSnapshot;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderItemStatus status;

    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    /** Internal fulfillment reference. A carrier label can replace this later. */
    @Column(unique = true, length = 64)
    private String shippingCode;

    private LocalDateTime processingAt;

    private LocalDateTime shippedAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ReturnStatus returnStatus;

    private LocalDateTime returnRequestedAt;

    @Column(length = 500)
    private String returnReason;

    @Column(length = 1500)
    private String returnDetails;

    @Column(length = 80)
    private String returnPreferredResolution;

    @ElementCollection
    @CollectionTable(name = "order_item_return_media", joinColumns = @JoinColumn(name = "order_item_id"))
    @OrderColumn(name = "display_order")
    @Column(name = "media_url", length = 1000)
    private java.util.List<String> returnMediaUrls = new java.util.ArrayList<>();

    @Column(length = 500)
    private String returnSellerNote;

    @Column(length = 64)
    private String returnAuthorizationCode;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = OrderItemStatus.PLACED;
        }
    }

    public Long getId() {
        return id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public Listing getListing() {
        return listing;
    }

    public void setListing(Listing listing) {
        this.listing = listing;
    }

    public Users getSeller() {
        return seller;
    }

    public void setSeller(Users seller) {
        this.seller = seller;
    }

    public String getTitleSnapshot() {
        return titleSnapshot;
    }

    public void setTitleSnapshot(String titleSnapshot) {
        this.titleSnapshot = titleSnapshot;
    }

    public BigDecimal getPriceSnapshot() {
        return priceSnapshot;
    }

    public void setPriceSnapshot(BigDecimal priceSnapshot) {
        this.priceSnapshot = priceSnapshot;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public OrderItemStatus getStatus() {
        return status;
    }

    public void setStatus(OrderItemStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getShippingCode() {
        return shippingCode;
    }

    public void setShippingCode(String shippingCode) {
        this.shippingCode = shippingCode;
    }

    public LocalDateTime getProcessingAt() {
        return processingAt;
    }

    public void setProcessingAt(LocalDateTime processingAt) {
        this.processingAt = processingAt;
    }

    public LocalDateTime getShippedAt() {
        return shippedAt;
    }

    public void setShippedAt(LocalDateTime shippedAt) {
        this.shippedAt = shippedAt;
    }

    public ReturnStatus getReturnStatus() { return returnStatus; }
    public void setReturnStatus(ReturnStatus returnStatus) { this.returnStatus = returnStatus; }
    public LocalDateTime getReturnRequestedAt() { return returnRequestedAt; }
    public void setReturnRequestedAt(LocalDateTime returnRequestedAt) { this.returnRequestedAt = returnRequestedAt; }
    public String getReturnReason() { return returnReason; }
    public void setReturnReason(String returnReason) { this.returnReason = returnReason; }
    public String getReturnDetails() { return returnDetails; }
    public void setReturnDetails(String returnDetails) { this.returnDetails = returnDetails; }
    public String getReturnPreferredResolution() { return returnPreferredResolution; }
    public void setReturnPreferredResolution(String value) { this.returnPreferredResolution = value; }
    public java.util.List<String> getReturnMediaUrls() { return returnMediaUrls; }
    public void setReturnMediaUrls(java.util.List<String> urls) { this.returnMediaUrls = urls == null ? new java.util.ArrayList<>() : new java.util.ArrayList<>(urls); }
    public String getReturnSellerNote() { return returnSellerNote; }
    public void setReturnSellerNote(String note) { this.returnSellerNote = note; }
    public String getReturnAuthorizationCode() { return returnAuthorizationCode; }
    public void setReturnAuthorizationCode(String code) { this.returnAuthorizationCode = code; }
}
