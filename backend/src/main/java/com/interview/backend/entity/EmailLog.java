package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * One row per email attempt: digest, location nudge, or admin announcement.
 * Lets the admin see who got what, and who didn't, and why.
 */
@Entity
@Table(name = "email_logs", indexes = {
        @Index(name = "idx_email_logs_user", columnList = "user_id"),
        @Index(name = "idx_email_logs_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "email", length = 320, nullable = false)
    private String email;

    /** DIGEST | NUDGE | ANNOUNCEMENT */
    @Column(name = "type", length = 20, nullable = false)
    private String type;

    @Column(name = "subject", length = 300)
    private String subject;

    /** SENT | FAILED */
    @Column(name = "status", length = 10, nullable = false)
    private String status;

    @Column(name = "error", length = 300)
    private String error;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public static EmailLog of(User u, String type, String subject, Exception failure) {
        EmailLog l = new EmailLog();
        l.setUserId(u.getId());
        l.setEmail(u.getEmail());
        l.setType(type);
        l.setSubject(subject);
        l.setStatus(failure == null ? "SENT" : "FAILED");
        l.setError(failure == null ? null : trim(failure.toString(), 300));
        return l;
    }

    private static String trim(String s, int max) {
        return s.length() > max ? s.substring(0, max) : s;
    }
}
