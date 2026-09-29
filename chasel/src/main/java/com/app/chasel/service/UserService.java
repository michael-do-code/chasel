package com.app.chasel.service;

import com.app.chasel.constants.LocationOptions;
import com.app.chasel.dto.SellerProfileResponse;
import com.app.chasel.dto.UpdateProfileRequest;
import com.app.chasel.dto.UserProfileResponse;
import com.app.chasel.model.Users;
import com.app.chasel.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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

    public SellerProfileResponse getSellerProfile(Long id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Seller not found"));
        return SellerProfileResponse.from(user);
    }

    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String state = blankToNull(request.getState());
        if (state != null && !LocationOptions.STATES.contains(state)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "State must be a valid US state");
        }

        user.setFirstName(blankToNull(request.getFirstName()));
        user.setLastName(blankToNull(request.getLastName()));
        user.setPhone(blankToNull(request.getPhone()));
        user.setAddress(blankToNull(request.getAddress()));
        user.setCity(blankToNull(request.getCity()));
        user.setState(state);
        user.setZipCode(blankToNull(request.getZipCode()));
        user.setAvatarUrl(blankToNull(request.getAvatarUrl()));
        userRepository.save(user);

        return toResponse(user);
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private UserProfileResponse toResponse(Users user) {
        return new UserProfileResponse(
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getAddress(),
                user.getCity(),
                user.getState(),
                user.getZipCode(),
                user.getAvatarUrl(),
                user.getCreatedAt());
    }
}
