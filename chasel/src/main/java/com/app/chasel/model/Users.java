package com.app.chasel.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String firstName;

    private String lastName;

    private String phone;

    private String address;

    private String city;

    // Stored in the legacy "location" column, which always held a US state name.
    @Column(name = "location")
    private String state;

    private String zipCode;

    @Column(length = 500)
    private String avatarUrl;

    private String resetCode;

    private LocalDateTime resetCodeExpiresAt;

    private boolean resetCodeVerified;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
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
    public String getResetCode() {
    return resetCode;
}

public void setResetCode(String resetCode) {
    this.resetCode = resetCode;
}

public LocalDateTime getResetCodeExpiresAt() {
    return resetCodeExpiresAt;
}

public void setResetCodeExpiresAt(LocalDateTime resetCodeExpiresAt) {
    this.resetCodeExpiresAt = resetCodeExpiresAt;
}

public boolean isResetCodeVerified() {
    return resetCodeVerified;
}

public void setResetCodeVerified(boolean resetCodeVerified) {
    this.resetCodeVerified = resetCodeVerified;
}
}
