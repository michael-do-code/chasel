package com.app.chasel.service;

import com.app.chasel.dto.UpdateProfileRequest;
import com.app.chasel.dto.UserProfileResponse;
import com.app.chasel.model.Users;
import com.app.chasel.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserProfileResponse getProfile(String email) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toResponse(user);
    }

    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        userRepository.save(user);

        return toResponse(user);
    }

    private UserProfileResponse toResponse(Users user) {
        return new UserProfileResponse(user.getEmail(), user.getFirstName(), user.getLastName(), user.getPhone(), user.getCreatedAt());
    }
}
