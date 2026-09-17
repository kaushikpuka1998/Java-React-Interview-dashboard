package com.interview.backend.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.host:not-set}")
    private String mailHost;

    @Value("${spring.mail.username:not-set}")
    private String mailUsername;

    @Value("${app.mail.from:noreply@interviewreader.com}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        log.info("Email service initialized - host: {}, username: {}", mailHost, mailUsername);
        if ("not-set".equals(mailHost) || "not-set".equals(mailUsername)) {
            log.warn("MAIL_HOST or MAIL_USERNAME not configured - emails will fail");
            return;
        }

        // Test SMTP connection
        try {
            if (mailSender instanceof JavaMailSenderImpl impl) {
                impl.testConnection();
                log.info("✓ Mail server connection successful - ready to send emails");
            } else {
                log.info("Mail sender configured (unable to test connection on startup)");
            }
        } catch (Exception e) {
            log.error("✗ Mail server connection failed: {} - Password reset emails will not work", e.toString());
        }
    }

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Reset your Interview Reader password");
        message.setText(
            "Hello,\n\n" +
            "You requested to reset your password for Interview Reader.\n\n" +
            "Click the link below to reset your password:\n" +
            resetLink + "\n\n" +
            "This link will expire in 1 hour.\n\n" +
            "If you didn't request this, you can safely ignore this email.\n\n" +
            "Best regards,\n" +
            "Interview Reader Team"
        );

        mailSender.send(message);
        log.info("Password reset email sent to {}", toEmail);
    }
}
