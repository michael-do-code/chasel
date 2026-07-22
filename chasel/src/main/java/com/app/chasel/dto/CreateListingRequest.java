package com.app.chasel.dto;

import java.util.List;

public class CreateListingRequest {
    private String title;
    private String description;
    private String category;
    private Double price;
    private boolean openToTrade;
    private String tradeDescription;
    private List<String> imageUrls;
    private String location;

    // getters and setters
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
}