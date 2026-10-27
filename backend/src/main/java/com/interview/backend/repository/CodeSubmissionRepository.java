package com.interview.backend.repository;

import com.interview.backend.entity.CodeSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CodeSubmissionRepository extends JpaRepository<CodeSubmission, Long> {
    List<CodeSubmission> findTop20ByUserEmailAndProblemIdOrderByCreatedAtDesc(String userEmail, Long problemId);
    Optional<CodeSubmission> findByIdAndUserEmail(Long id, String userEmail);
}
