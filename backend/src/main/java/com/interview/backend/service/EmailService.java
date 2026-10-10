package com.interview.backend.service;

import com.interview.backend.entity.Question;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;

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

    @Value("${app.public-base-url:http://localhost:8082}")
    private String backendUrl;

    @Value("${app.jwt.secret}")
    private String signingSecret;

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

    
    public void sendExportCodeEmail(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Dashboard Export Unlock Code");
        message.setText("Your daily unlock code for exporting data is: " + code + "\n\n" +
            "This code is valid for 24 hours (UTC timezone).");
        mailSender.send(message);
        log.info("Export code email sent to {}", toEmail);
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

    /** One email per user listing the questions just published. Caller handles per-user failures. */
    public void sendNewQuestionsEmail(String toEmail, String name, List<Question> questions) {
        String subject = questions.size() == 1
                ? "New interview question today: " + questions.get(0).getTitle()
                : questions.size() + " new interview questions added today";

        StringBuilder body = new StringBuilder("Hi" + (name == null || name.isBlank() ? "" : " " + name) + ",\n\n")
                .append("Here's what was added to Interview Reader in the last 24 hours:\n\n");
        questions.stream().limit(25).forEach(q -> body
                .append("• [").append(q.getTech()).append("] ").append(q.getTitle()).append("\n  ")
                .append(frontendUrl).append("/?id=").append(URLEncoder.encode(q.getId(), StandardCharsets.UTF_8))
                .append("\n\n"));
        if (questions.size() > 25) body.append("…and ").append(questions.size() - 25).append(" more at ")
                .append(frontendUrl).append("\n\n");
        body.append("Happy preparing!\nInterview Reader Team\n\n")
            .append("Don't want these emails? Unsubscribe: ")
            .append(backendUrl).append("/api/auth/unsubscribe?email=")
            .append(URLEncoder.encode(toEmail, StandardCharsets.UTF_8))
            .append("&sig=").append(unsubscribeSig(toEmail));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body.toString());
        mailSender.send(message);
    }

    /** HMAC of the email so the unsubscribe link can't be forged for someone else. */
    String unsubscribeSig(String email) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(("unsubscribe:" + email.toLowerCase()).getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public boolean isValidUnsubscribe(String email, String sig) {
        return sig != null && MessageDigest.isEqual(
                unsubscribeSig(email).getBytes(StandardCharsets.UTF_8), sig.getBytes(StandardCharsets.UTF_8));
    }
}
