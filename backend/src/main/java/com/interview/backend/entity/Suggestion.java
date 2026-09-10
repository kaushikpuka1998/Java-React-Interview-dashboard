package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A reader's proposed edit to a question, awaiting an admin decision.
 *
 * Approving copies the proposed fields onto the live question; rejecting leaves the
 * question untouched and the row stays as the archive of what was turned down.
 * `seen` drives the reader's notification: false once decided, true after they look.
 */
@Entity
@Table(name = "question_suggestions", indexes = {
        @Index(name = "idx_sugg_status", columnList = "status"),
        @Index(name = "idx_sugg_user", columnList = "user_id"),
        @Index(name = "idx_sugg_question", columnList = "question_id")
})
@Getter
@Setter
@NoArgsConstructor
public class Suggestion {

    public static final String PENDING = "PENDING";
    public static final String APPROVED = "APPROVED";
    public static final String REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_id", nullable = false, length = 100)
    private String questionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Denormalised so the admin list needs no join to show who proposed it. */
    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "proposed_title", length = 500)
    private String proposedTitle;

    @Column(name = "proposed_question", columnDefinition = "TEXT")
    private String proposedQuestion;

    @Column(name = "proposed_answer", columnDefinition = "TEXT")
    private String proposedAnswer;

    /** Why the reader thinks the change is needed. */
    @Column(name = "note", length = 1000)
    private String note;

    @Column(name = "status", nullable = false, length = 20)
    private String status = PENDING;

    /** Admin's reason, shown to the reader when rejected. */
    @Column(name = "admin_note", length = 1000)
    private String adminNote;

    @Column(name = "seen", nullable = false)
    private boolean seen = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "reviewed_at")
    private Instant reviewedAt;
}
