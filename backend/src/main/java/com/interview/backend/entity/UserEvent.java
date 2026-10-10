package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Engagement events beyond page views:
 *   read  — time spent and how far the answer was scrolled, per question open
 *   click — which control was clicked (button/link label)
 * Like PageView, no IP is stored.
 */
@Entity
@Table(name = "user_events", indexes = {
        @Index(name = "idx_ue_created", columnList = "created_at"),
        @Index(name = "idx_ue_user", columnList = "user_id"),
        @Index(name = "idx_ue_question", columnList = "question_id")
})
@Getter
@Setter
@NoArgsConstructor
public class UserEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 10, nullable = false)
    private String type;   // read | click

    @Column(name = "question_id", length = 100)
    private String questionId;

    /** Click target label. */
    @Column(length = 80)
    private String label;

    /** read: deepest scroll position reached, 0-100. */
    @Column(name = "scroll_pct")
    private Integer scrollPct;

    /** read: seconds the question was on screen with the tab visible. */
    private Integer seconds;

    @Column(name = "session_id", length = 64)
    private String sessionId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
