package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A reader flagging a question as a duplicate of another. Sits in an admin
 * queue: the admin either deletes the question (resolving it) or dismisses
 * the report as not actually a duplicate.
 */
@Entity
@Table(name = "duplicate_reports", indexes = {
        @Index(name = "idx_duprep_status", columnList = "status"),
        @Index(name = "idx_duprep_question", columnList = "question_id")
})
@Getter
@Setter
@NoArgsConstructor
public class DuplicateReport {

    public static final String PENDING = "PENDING";
    public static final String DISMISSED = "DISMISSED";
    public static final String RESOLVED = "RESOLVED";   // question was deleted because of this report

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_id", nullable = false, length = 100)
    private String questionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Denormalised so the admin list needs no join to show who reported it. */
    @Column(name = "user_email", nullable = false)
    private String userEmail;

    /** Which question the reader thinks this duplicates, in their own words. */
    @Column(name = "note", length = 1000)
    private String note;

    @Column(name = "status", nullable = false, length = 20)
    private String status = PENDING;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "reviewed_at")
    private Instant reviewedAt;
}
