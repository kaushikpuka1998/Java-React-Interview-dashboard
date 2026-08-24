package com.interview.backend.repository;

import com.interview.backend.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, String> {

    Optional<Question> findById(String id);

    List<Question> findByTech(String tech);

    List<Question> findByTechAndNumber(String tech, Integer number);

    Page<Question> findByTech(String tech, Pageable pageable);

    @Query("SELECT q FROM Question q WHERE " +
           "(:tech IS NULL OR q.tech = :tech) AND " +
           "(:category IS NULL OR q.category = :category) AND " +
           "(:difficulty IS NULL OR q.difficulty = :difficulty) AND " +
           "(:search IS NULL OR LOWER(q.title) LIKE %:search% OR LOWER(q.question) LIKE %:search% OR LOWER(q.answer) LIKE %:search% OR LOWER(q.category) LIKE %:search%) AND " +
           "(:status IS NULL OR " +
           "  (:status = 'visited' AND q.id IN :visitedIds) OR " +
           "  (:status = 'solved' AND q.id IN :readIds) OR " +
           "  (:status = 'unsolved' AND q.id NOT IN :readIds)" +
           ")")
    Page<Question> searchQuestions(
            @Param("tech") String tech,
            @Param("category") String category,
            @Param("difficulty") String difficulty,
            @Param("search") String search,
            @Param("status") String status,
            @Param("visitedIds") List<String> visitedIds,
            @Param("readIds") List<String> readIds,
            Pageable pageable);

    @Query("SELECT DISTINCT q.category FROM Question q WHERE q.tech = :tech ORDER BY q.category")
    List<String> findCategoriesByTech(@Param("tech") String tech);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.tech = :tech")
    long countByTech(@Param("tech") String tech);

    @Query("SELECT COUNT(q) FROM Question q")
    long countAll();
}