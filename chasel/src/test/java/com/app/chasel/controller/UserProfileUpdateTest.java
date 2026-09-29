package com.app.chasel.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.app.chasel.model.Users;
import com.app.chasel.repository.UserRepository;
import com.app.chasel.security.JwtUtil;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The edit profile form saves a 10-digit phone number and a full US address
 * (street, city, state, ZIP); anything malformed is rejected with a message.
 */
@SpringBootTest
@AutoConfigureMockMvc
class UserProfileUpdateTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private String token;

    @BeforeEach
    void seedUser() {
        Users user = new Users();
        user.setEmail("profile-" + System.nanoTime() + "@example.com");
        user.setPassword("irrelevant-hash");
        user = userRepository.save(user);
        token = jwtUtil.generateToken(user.getEmail());
    }

    private String payload(String phone, String state, String zipCode) {
        return """
                {
                  "firstName": "Ada",
                  "lastName": "Lovelace",
                  "phone": "%s",
                  "address": "123 Main St",
                  "city": "Austin",
                  "state": "%s",
                  "zipCode": "%s"
                }
                """.formatted(phone, state, zipCode);
    }

    @Test
    void savesValidPhoneAndAddress() throws Exception {
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload("5125550123", "Texas", "78701")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("5125550123"))
                .andExpect(jsonPath("$.address").value("123 Main St"))
                .andExpect(jsonPath("$.city").value("Austin"))
                .andExpect(jsonPath("$.state").value("Texas"))
                .andExpect(jsonPath("$.zipCode").value("78701"));
    }

    @Test
    void allowsClearingOptionalFields() throws Exception {
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload("", "", "")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").doesNotExist())
                .andExpect(jsonPath("$.state").doesNotExist())
                .andExpect(jsonPath("$.zipCode").doesNotExist());
    }

    @Test
    void savesAndRemovesProfilePhoto() throws Exception {
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "avatarUrl": "http://localhost:8080/uploads/avatar.png" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").value("http://localhost:8080/uploads/avatar.png"));

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "avatarUrl": "" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").doesNotExist());
    }

    @Test
    void rejectsAvatarThatIsNotAUrl() throws Exception {
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "avatarUrl": "javascript:alert(1)" }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Profile photo must be an uploaded image"));
    }

    @Test
    void rejectsPhoneThatIsNotTenDigits() throws Exception {
        for (String phone : new String[] {"512555012", "51255501234", "512-555-0123", "abcdefghij"}) {
            mockMvc.perform(put("/api/users/me")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload(phone, "Texas", "78701")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.detail").value("Phone number must be exactly 10 digits"));
        }
    }

    @Test
    void rejectsMalformedZipCode() throws Exception {
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload("5125550123", "Texas", "7870")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("ZIP code must be exactly 5 digits"));
    }

    @Test
    void rejectsUnknownState() throws Exception {
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload("5125550123", "Atlantis", "78701")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("State must be a valid US state"));
    }
}
