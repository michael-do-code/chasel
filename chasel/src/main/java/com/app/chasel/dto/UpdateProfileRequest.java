package com.app.chasel.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {
    @Size(max = 50, message = "First name must be 50 characters or fewer")
    private String firstName;

    @Size(max = 50, message = "Last name must be 50 characters or fewer")
    private String lastName;

    // Optional, but when present it must be exactly 10 digits.
    @Pattern(regexp = "^$|^\\d{10}$", message = "Phone number must be exactly 10 digits")
    private String phone;

    @Size(max = 120, message = "Address must be 120 characters or fewer")
    private String address;

    @Size(max = 60, message = "City must be 60 characters or fewer")
    private String city;

    private String state;

    @Pattern(regexp = "^$|^\\d{5}$", message = "ZIP code must be exactly 5 digits")
    private String zipCode;

    // Set from a URL returned by /api/uploads; blank removes the photo.
    @Size(max = 500, message = "Profile photo URL is too long")
    @Pattern(regexp = "^$|^https?://\\S+$", message = "Profile photo must be an uploaded image")
    private String avatarUrl;

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getZipCode() {
        return zipCode;
    }

    public void setZipCode(String zipCode) {
        this.zipCode = zipCode;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
