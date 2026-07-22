package com.app.chasel.controller;

import com.app.chasel.dto.UpdateProfileRequest;
import com.app.chasel.dto.UserProfileResponse;
import com.app.chasel.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserProfileResponse getProfile(Authentication authentication) {
        return userService.getProfile(authentication.getName());
    }

    @PutMapping("/me")
    public UserProfileResponse updateProfile(Authentication authentication, @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(authentication.getName(), request);
    }
}
