package com.interview.backend.repository;

import com.interview.backend.entity.CodingProblem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CodingProblemRepository extends JpaRepository<CodingProblem, Long> {
    List<CodingProblem> findAllByOrderByIdAsc();

    /** Listing row: only these columns are read, so statements, test cases and templates stay in the database. */
    interface Summary {
        Long getId();
        String getTitle();
        String getDifficulty();
        java.time.Instant getCreatedAt();
    }

    List<Summary> findSummariesByOrderByIdAsc();
}
