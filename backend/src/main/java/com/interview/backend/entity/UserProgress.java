package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// One row per (user, question). Tracks whether the user visited and/or read the question.
@Entity
@Table(name = "user_progress",
        uniqueConstraints = @UniqueConstraint(name = "uq_user_question", columnNames = {"user_id", "question_id"}),
        indexes = @Index(name = "idx_progress_user", columnList = "user_id"))
@Getter
@Setter
@NoArgsConstructor
public class UserProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "question_id", nullable = false, length = 100)
    private String questionId;

    @Column(nullable = false)
    private boolean visited = false;

    @Column(nullable = false)
    private boolean read = false;
}
