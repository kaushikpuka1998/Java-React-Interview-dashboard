package com.interview.backend.repository;

import com.interview.backend.entity.ResumeTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResumeTemplateRepository extends JpaRepository<ResumeTemplate, Long> {
    Optional<ResumeTemplate> findBySlug(String slug);
    List<ResumeTemplate> findAllByOrderByNameAsc();
}
