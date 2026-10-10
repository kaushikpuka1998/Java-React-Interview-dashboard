package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One row per daily new-questions digest. Doubles as the cross-instance lock
 * (unique run_date: only one instance can create today's row) and the watermark
 * (the next run starts where the last DONE one stopped, so missed days roll forward).
 */
@Entity
@Table(name = "digest_runs", uniqueConstraints = @UniqueConstraint(name = "uk_digest_run_date", columnNames = "run_date"))
@Getter
@Setter
@NoArgsConstructor
public class DigestRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_date", nullable = false)
    private LocalDate runDate;

    /** Questions with createdAt in [coveredFrom, coveredTo) belong to this digest. */
    @Column(name = "covered_from", nullable = false)
    private LocalDateTime coveredFrom;

    @Column(name = "covered_to", nullable = false)
    private LocalDateTime coveredTo;

    @Column(length = 8, nullable = false)
    private String status;   // RUNNING | DONE

    /** Random id of the instance currently sending; heartbeats and finishing require it to match. */
    @Column(length = 36, nullable = false)
    private String owner;

    @Column(name = "heartbeat_at", nullable = false)
    private Instant heartbeatAt;

    private Integer questionCount;
    private Integer sentCount;
    private Instant finishedAt;
}
