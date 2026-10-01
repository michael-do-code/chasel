package com.app.chasel.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetEmailService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetEmailService.class);
    private final JavaMailSender mailSender;
    private final boolean enabled;
    private final String from;

    public PasswordResetEmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${chasel.mail.enabled:false}") boolean enabled,
            @Value("${chasel.mail.from:no-reply@chasel.local}") String from) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.enabled = enabled;
        this.from = from;
    }

    public void sendVerificationCode(String email, String code) {
        if (!enabled || mailSender == null) {
            log.warn("=== PASSWORD RESET CODE for {}: {} (expires in 10 minutes) ===", email, code);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Your Chasel password reset code");
        message.setText("Your verification code is %s. It expires in 10 minutes.\n\nIf you did not request this, you can ignore this email."
                .formatted(code));
        try {
            mailSender.send(message);
        } catch (MailException exception) {
            log.error("Could not send password reset code to {}", email, exception);
        }
    }
}
