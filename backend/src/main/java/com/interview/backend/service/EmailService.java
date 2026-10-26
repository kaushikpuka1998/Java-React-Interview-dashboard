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
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

    /** One email per user: questions added and questions edited since their last digest. */
    public void sendNewQuestionsEmail(String toEmail, String name, List<Question> added, List<Question> updated) {
        int total = added.size() + updated.size();
        String subject;
        if (added.isEmpty()) {
            subject = updated.size() == 1 ? "Updated interview question: " + updated.get(0).getTitle()
                    : updated.size() + " interview questions updated";
        } else if (updated.isEmpty()) {
            subject = added.size() == 1 ? "New interview question today: " + added.get(0).getTitle()
                    : added.size() + " new interview questions added today";
        } else {
            subject = added.size() + " new and " + updated.size() + " updated interview questions";
        }

        StringBuilder body = new StringBuilder("Hi" + (name == null || name.isBlank() ? "" : " " + name) + ",\n\n");
        int room = 25;
        if (!added.isEmpty()) {
            body.append("New questions:\n\n");
            for (Question q : added.stream().limit(room).toList()) appendQuestion(body, q, "");
            room -= Math.min(added.size(), room);
            if (added.size() > 25) body.append("…and ").append(added.size() - 25).append(" more\n\n");
        }
        if (!updated.isEmpty()) {
            body.append("Updated questions:\n\n");
            for (Question q : updated.stream().limit(Math.max(room, 0)).toList()) appendQuestion(body, q, " (updated)");
            if (updated.size() > Math.max(room, 0)) body.append("…and ").append(updated.size() - Math.max(room, 0)).append(" more\n\n");
        }
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

    private void appendQuestion(StringBuilder body, Question q, String tag) {
        body.append("• [").append(q.getTech()).append("] ").append(q.getTitle()).append(tag).append("\n  ")
            .append(frontendUrl).append("/?id=").append(URLEncoder.encode(q.getId(), StandardCharsets.UTF_8))
            .append("\n\n");
    }

    /** Admin announcement: the admin's own subject and text, with the same unsubscribe footer. */
    public void sendAnnouncement(String toEmail, String subject, String body) {
        String unsubscribe = backendUrl + "/api/auth/unsubscribe?email=" + URLEncoder.encode(toEmail, StandardCharsets.UTF_8) +
                "&sig=" + unsubscribeSig(toEmail);
        String plain = body + "\n\n---\nDon't want these emails? Unsubscribe: " + unsubscribe;
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8"); // multipart: plain text + HTML
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(plain, announcementHtml(body, unsubscribe));
            mailSender.send(mime);
        } catch (MessagingException e) {
            throw new IllegalStateException("Could not build the announcement email", e);
        }
    }

    // HTML version: paragraphs, links for web addresses, and a button for the practice page.
    private String announcementHtml(String body, String unsubscribe) {
        StringBuilder html = new StringBuilder("<div style=\"font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1e293b;max-width:560px\">");
        for (String paragraph : body.split("\\n\\s*\\n")) {
            String text = paragraph.strip();
            if (!text.isEmpty()) html.append("<p style=\"margin:0 0 14px\">").append(linkify(text)).append("</p>");
        }
        html.append("<p style=\"margin-top:24px;font-size:12px;color:#64748b\">Don't want these emails? <a href=\"")
                .append(escapeHtml(unsubscribe)).append("\">Unsubscribe</a></p></div>");
        return html.toString();
    }

    private static final Pattern WEB_ADDRESS = Pattern.compile("https?://[^\\s<]+");

    private String linkify(String text) {
        Matcher m = WEB_ADDRESS.matcher(escapeHtml(text));
        StringBuilder out = new StringBuilder();
        while (m.find()) {
            String url = m.group();
            String replacement = url.startsWith(frontendUrl + "/practice")
                    ? "<a href=\"" + url + "\" style=\"display:inline-block;padding:12px 22px;border-radius:10px;background:linear-gradient(90deg,#f97316,#ec4899,#7c3aed);color:#ffffff;text-decoration:none;font-weight:bold\">Open practice coding</a>"
                    : "<a href=\"" + url + "\">" + url + "</a>";
            m.appendReplacement(out, Matcher.quoteReplacement(replacement));
        }
        m.appendTail(out);
        return out.toString().replace("\n", "<br>");
    }

    private static String escapeHtml(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    /** Asks a member without a location to add one, so they can appear on the leaderboard. */
    public void sendLocationNudgeEmail(String toEmail, String name) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Add your location to join the weekly leaderboard");
        message.setText("Hi" + (name == null || name.isBlank() ? "" : " " + name) + ",\n\n" +
                "Members who add their country and city appear on the weekly leaderboard, " +
                "and earn a league as they read.\n\n" +
                "Add your location here (takes 10 seconds):\n" +
                frontendUrl + "/profile\n\n" +
                "Happy preparing!\nInterview Reader Team\n\n" +
                "Don't want these emails? Unsubscribe: " + backendUrl + "/api/auth/unsubscribe?email=" +
                URLEncoder.encode(toEmail, StandardCharsets.UTF_8) + "&sig=" + unsubscribeSig(toEmail));
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
