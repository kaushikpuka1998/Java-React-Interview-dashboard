package com.interview.backend.repository;

import com.interview.backend.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String resetToken);
    boolean existsByEmail(String email);

    /** New-signup counters and feed for the admin dashboard. */
    long countByCreatedAtAfter(Instant since);

    List<User> findByCreatedAtAfterOrderByCreatedAtDesc(Instant since, Pageable pageable);

    List<User> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Subscribed members who haven't yet received the digest ending at :coveredTo. */
    @org.springframework.data.jpa.repository.Query(
            "SELECT u FROM User u WHERE (u.emailOptOut IS NULL OR u.emailOptOut = false) " +
            "AND (u.lastDigestAt IS NULL OR u.lastDigestAt < :coveredTo) ORDER BY u.id")
    List<User> findDigestRecipients(@org.springframework.data.repository.query.Param("coveredTo") java.time.LocalDateTime coveredTo);

    /** Targeted update so a concurrent profile/geo save can't clobber it (and vice versa). */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("UPDATE User u SET u.lastDigestAt = :at WHERE u.id = :id")
    int markDigested(@org.springframework.data.repository.query.Param("id") Long id,
                     @org.springframework.data.repository.query.Param("at") java.time.LocalDateTime at);

    /** Members per country, unknown last. Row: country (null = unknown), members. */
    @org.springframework.data.jpa.repository.Query(
            "SELECT u.country, COUNT(u) FROM User u GROUP BY u.country ORDER BY COUNT(u) DESC")
    List<Object[]> countByCountry();
}
