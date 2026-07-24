package com.app.chasel.controller;

import com.app.chasel.dto.AuthResponse;
import com.app.chasel.dto.LoginRequest;
import com.app.chasel.dto.RegisterRequest;
import com.app.chasel.service.AuthService;
import org.springframework.web.bind.annotation.*;
import com.app.chasel.dto.ForgotPasswordRequest;
import com.app.chasel.dto.VerifyCodeRequest;
import com.app.chasel.dto.ResetPasswordRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        String token = authService.register(request);
        return new AuthResponse(token);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        String token = authService.login(request);
        return new AuthResponse(token);
    }
    @PostMapping("/forgot-password")
public Map<String, String> forgotPassword(
        @RequestBody ForgotPasswordRequest request
) {
    authService.forgotPassword(request);

    return Map.of(
            "message",
            "Verification code generated"
    );
}

@PostMapping("/verify-code")
public AuthResponse verifyCode(
        @RequestBody VerifyCodeRequest request
) {
    String token = authService.verifyCode(request);
    return new AuthResponse(token);
}

@PostMapping("/reset-password")
public Map<String, String> resetPassword(
        @RequestBody ResetPasswordRequest request
) {
    authService.resetPassword(request);

    return Map.of(
            "message",
            "Password reset successfully"
    );
}
}