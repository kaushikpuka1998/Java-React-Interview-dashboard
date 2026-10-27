package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** One saved "Submit" of a coding problem: the code, the verdict, and the per-test results. */
@Entity
@Table(name = "code_submissions")
@Getter
@Setter
@NoArgsConstructor
public class CodeSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false, length = 255)
    private String userEmail;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(name = "language", length = 20)
    private String language;

    @Column(name = "code", columnDefinition = "TEXT")
    private String code;

    @Column(name = "status", length = 40)
    private String status;

    @Column(name = "passed")
    private int passed;

    @Column(name = "total")
    private int total;

    /** JSON list of the per-test results, as shown to the member. */
    @Column(name = "results", columnDefinition = "TEXT")
    private String results;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();
}
