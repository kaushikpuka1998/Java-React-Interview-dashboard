package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A company that questions have been reported as asked at.
 *
 * `slug` is the normalised form (lowercased, collapsed whitespace) and carries the
 * unique constraint, so "Google", "google" and " Google " resolve to one row while
 * `name` keeps the nicest spelling for display.
 */
@Entity
@Table(name = "companies", indexes = @Index(name = "idx_company_slug", columnList = "slug", unique = true))
@Getter
@Setter
@NoArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Company(String name, String slug) {
        this.name = name;
        this.slug = slug;
    }

    /** Normalised key used for dedupe and lookup. */
    public static String toSlug(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase().replaceAll("\\s+", " ");
    }
}
