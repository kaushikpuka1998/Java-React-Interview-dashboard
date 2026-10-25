package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** A member's resume: the template it uses and its content as JSON (see LatexRenderer for the shape). */
@Entity
@Table(name = "resumes", indexes = @Index(name = "idx_resumes_user", columnList = "user_id"))
@Getter
@Setter
@NoArgsConstructor
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String data;

    /** Custom LaTeX edited by the member. When set, it replaces the generated LaTeX for download and compile. */
    @Column(name = "latex_override", columnDefinition = "TEXT")
    private String latexOverride;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
