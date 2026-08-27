package com.interview.backend.repository;

import com.interview.backend.entity.QuestionCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuestionCompanyRepository extends JpaRepository<QuestionCompany, Long> {

    Optional<QuestionCompany> findByQuestionIdAndCompanyIdAndUserId(String questionId, Long companyId, Long userId);

    List<QuestionCompany> findByQuestionIdAndUserId(String questionId, Long userId);

    /** Company name + how many distinct people reported it, for one question. */
    @Query("SELECT c.name, COUNT(DISTINCT qc.userId) FROM QuestionCompany qc " +
           "JOIN Company c ON c.id = qc.companyId " +
           "WHERE qc.questionId = :questionId " +
           "GROUP BY c.id, c.name ORDER BY COUNT(DISTINCT qc.userId) DESC, c.name")
    List<Object[]> companiesForQuestion(@Param("questionId") String questionId);

    long countByQuestionId(String questionId);
}
