package com.interview.backend.repository;

import com.interview.backend.entity.Company;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findBySlug(String slug);

    /** Typeahead: existing companies whose name contains the typed text. */
    @Query("SELECT c FROM Company c WHERE LOWER(c.name) LIKE CONCAT('%', :q, '%') ORDER BY c.name")
    List<Company> search(@Param("q") String q, Pageable pageable);

    /** Companies ordered by how many question reports mention them. */
    @Query("SELECT c.name, COUNT(qc) FROM Company c JOIN QuestionCompany qc ON qc.companyId = c.id " +
           "GROUP BY c.id, c.name ORDER BY COUNT(qc) DESC")
    List<Object[]> mostReported(Pageable pageable);
}
