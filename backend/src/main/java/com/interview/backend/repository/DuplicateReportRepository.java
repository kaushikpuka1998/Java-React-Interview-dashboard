package com.interview.backend.repository;

import com.interview.backend.entity.DuplicateReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DuplicateReportRepository extends JpaRepository<DuplicateReport, Long> {

    List<DuplicateReport> findByStatusOrderByCreatedAtDesc(String status);

    long countByStatus(String status);

    boolean existsByQuestionIdAndUserIdAndStatus(String questionId, Long userId, String status);
}
