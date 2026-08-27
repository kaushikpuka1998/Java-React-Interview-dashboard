package com.interview.backend.repository;

import com.interview.backend.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    /** New-signup counters and feed for the admin dashboard. */
    long countByCreatedAtAfter(Instant since);

    List<User> findByCreatedAtAfterOrderByCreatedAtDesc(Instant since, Pageable pageable);

    List<User> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
