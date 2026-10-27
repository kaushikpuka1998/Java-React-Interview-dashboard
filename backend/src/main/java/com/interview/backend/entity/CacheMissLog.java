package com.interview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** One row per cache miss: the cached method ran and fetched from the database. */
@Entity
@Table(name = "cache_miss_logs")
@Getter
@Setter
@NoArgsConstructor
public class CacheMissLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cache_name", nullable = false, length = 60)
    private String cacheName;

    @Column(name = "cache_key", length = 255)
    private String cacheKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public CacheMissLog(String cacheName, String cacheKey) {
        this.cacheName = cacheName;
        this.cacheKey = cacheKey;
    }
}
