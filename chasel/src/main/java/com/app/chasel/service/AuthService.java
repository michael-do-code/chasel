package com.app.chasel.service;

import com.app.chasel.dto.LoginRequest;
import com.app.chasel.dto.RegisterRequest;
import com.app.chasel.model.Users;
import com.app.chasel.repository.UserRepository;
import com.app.chasel.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.app.chasel.dto.ForgotPasswordRequest;
import com.app.chasel.dto.VerifyCodeRequest;
import com.app.chasel.dto.ResetPasswordRequest;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public String register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }

        Users user = new Users();

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setLocation(request.getLocation());

userRepository.save(user);

        return jwtUtil.generateToken(user.getEmail());
    }

    public String login(LoginRequest request) {
        Users user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        return jwtUtil.generateToken(user.getEmail());
    }
    public void forgotPassword(ForgotPasswordRequest request) {
    Users user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Email not found"));

    String code = String.format(
            "%06d",
            new SecureRandom().nextInt(1_000_000)
    );

    user.setResetCode(passwordEncoder.encode(code));
    user.setResetCodeExpiresAt(LocalDateTime.now().plusMinutes(10));
    user.setResetCodeVerified(false);

    userRepository.save(user);

    System.out.println(
            "PASSWORD RESET CODE for "
                    + user.getEmail()
                    + ": "
                    + code
    );
}

public String verifyCode(VerifyCodeRequest request) {
    Users user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Email not found"));

    if (user.getResetCode() == null
            || user.getResetCodeExpiresAt() == null) {
        throw new RuntimeException("No reset code requested");
    }

    if (LocalDateTime.now().isAfter(user.getResetCodeExpiresAt())) {
        throw new RuntimeException("Verification code expired");
    }

    if (!passwordEncoder.matches(
            request.getCode(),
            user.getResetCode()
    )) {
        throw new RuntimeException("Invalid verification code");
    }

    user.setResetCodeVerified(true);
    userRepository.save(user);
    return jwtUtil.generateToken(user.getEmail());
}

public void resetPassword(ResetPasswordRequest request) {
    Users user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Email not found"));

    if (!user.isResetCodeVerified()) {
        throw new RuntimeException(
                "Verification code has not been verified"
        );
    }

    if (request.getNewPassword() == null
            || request.getNewPassword().length() < 6) {
        throw new RuntimeException(
                "Password must have at least 6 characters"
        );
    }

    user.setPassword(
            passwordEncoder.encode(request.getNewPassword())
    );

    user.setResetCode(null);
    user.setResetCodeExpiresAt(null);
    user.setResetCodeVerified(false);

    userRepository.save(user);
}
}