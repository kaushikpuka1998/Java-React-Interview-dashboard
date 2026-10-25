package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A LaTeX layout. Loaded from resources/resume-templates/*.tex on startup. */
@Entity
@Table(name = "resume_templates")
@Getter
@Setter
@NoArgsConstructor
public class ResumeTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 300)
    private String description;

    /** Section order, e.g. header,summary,skills,experience,projects,education,achievements */
    @Column(nullable = false, length = 300)
    private String layout;

    /** Everything before \begin{document}: document class, packages, and layout macros. */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String preamble;
}
