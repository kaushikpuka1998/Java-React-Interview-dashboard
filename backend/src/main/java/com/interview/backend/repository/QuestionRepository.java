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
           // when :restrict is true only the allowed (free) techs are visible
           "(:restrict = false OR q.tech IN :allowedTechs) AND " +
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
            @Param("restrict") boolean restrict,
            @Param("allowedTechs") List<String> allowedTechs,
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

    @Query("SELECT COALESCE(MAX(q.number), 0) FROM Question q WHERE q.tech = :tech")
    int maxNumberByTech(@Param("tech") String tech);

    /**
     * Highest numeric suffix actually used by an id for this tech, e.g. "java-695" -> 695.
     *
     * Imported data has ids and `number` values that do not line up (java's MAX(number)
     * is 575 while ids run past 695), so a new id must be derived from the ids
     * themselves or it collides with an existing row.
     */
    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM '[0-9]+$') AS INTEGER)), 0) " +
                   "FROM questions WHERE tech = :tech AND id ~ '-[0-9]+$'", nativeQuery = true)
    int maxIdSuffixByTech(@Param("tech") String tech);

    @Query("SELECT COALESCE(MAX(q.sortKey), 0) FROM Question q")
    int maxSortKey();

    @Query("SELECT DISTINCT q.tech FROM Question q ORDER BY q.tech")
    List<String> findDistinctTechs();

    @Query("SELECT DISTINCT q.difficulty FROM Question q WHERE q.difficulty IS NOT NULL ORDER BY q.difficulty")
    List<String> findDistinctDifficulties();

    @Query("SELECT COUNT(q) FROM Question q WHERE q.difficulty = :difficulty")
    long countByDifficulty(@Param("difficulty") String difficulty);
}