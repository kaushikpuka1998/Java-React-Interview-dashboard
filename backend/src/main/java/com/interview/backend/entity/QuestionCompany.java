package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A user's report that a given question was asked at a given company.
 *
 * One row per (question, company, user) so the same person cannot inflate the count
 * by reporting twice, while different people reporting the same pair each add one.
 */
@Entity
@Table(name = "question_companies",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_question_company_user",
                columnNames = {"question_id", "company_id", "user_id"}),
        indexes = {
                @Index(name = "idx_qc_question", columnList = "question_id"),
                @Index(name = "idx_qc_company", columnList = "company_id")
        })
@Getter
@Setter
@NoArgsConstructor
public class QuestionCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_id", nullable = false, length = 100)
    private String questionId;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Optional: roughly when the interview happened, e.g. "2026" or "Q1 2026". */
    @Column(name = "asked_on", length = 40)
    private String askedOn;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
