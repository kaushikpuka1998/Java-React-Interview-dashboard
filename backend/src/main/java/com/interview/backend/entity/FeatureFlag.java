package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** One row per feature flag an admin has changed. Flags with no row use their default (see FeatureFlagController). */
@Entity
@Table(name = "feature_flags")
@Getter
@Setter
@NoArgsConstructor
public class FeatureFlag {

    @Id
    @Column(name = "flag_key", length = 64)
    private String key;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
