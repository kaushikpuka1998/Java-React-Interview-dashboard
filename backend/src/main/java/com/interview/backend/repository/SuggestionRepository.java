package com.interview.backend.repository;

import com.interview.backend.entity.Suggestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SuggestionRepository extends JpaRepository<Suggestion, Long> {

    List<Suggestion> findByStatusOrderByCreatedAtDesc(String status);

    List<Suggestion> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByStatus(String status);

    /** How many decisions this reader has not looked at yet — the bell's badge. */
    long countByUserIdAndSeenFalseAndStatusNot(Long userId, String status);
}
