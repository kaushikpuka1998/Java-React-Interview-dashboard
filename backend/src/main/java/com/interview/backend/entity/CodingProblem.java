package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** A LeetCode-style problem: a statement plus test cases the code runner checks. Kept apart from normal questions. */
@Entity
@Table(name = "coding_problems")
@Getter
@Setter
@NoArgsConstructor
public class CodingProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", length = 300, nullable = false)
    private String title;

    @Column(name = "difficulty", length = 20)
    private String difficulty;

    @Column(name = "statement", columnDefinition = "TEXT", nullable = false)
    private String statement;

    /** JSON list of {"input": "...", "expected": "..."}. Never sent to the browser. */
    @Column(name = "test_cases", columnDefinition = "TEXT", nullable = false)
    private String testCases;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();
}
