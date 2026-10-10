package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "app_users", indexes = @Index(name = "idx_users_email", columnList = "email", unique = true))
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String name;

    private String resetToken;

    private Instant resetTokenExpiry;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    /** Last explicit sign-in; lets analytics tell "logged in only" apart from actual use. */
    private Instant lastLoginAt;

    /** Nullable on purpose: existing rows get null (= subscribed) without a column default. */
    private Boolean emailOptOut;

    /** coveredTo of the last digest this member received; a resumed run skips them. */
    private java.time.LocalDateTime lastDigestAt;

    /** Where the member is from. Typed by the user, or else resolved from their IP (the IP itself is never stored). */
    private String country;
    private String city;

    /** "user" when they entered it — IP lookups never overwrite that — or "ip". */
    @Column(length = 8)
    private String locationSource;
}
