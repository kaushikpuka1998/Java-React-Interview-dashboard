package com.interview.backend.repository;

import com.interview.backend.entity.CodingProblem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CodingProblemRepository extends JpaRepository<CodingProblem, Long> {
    List<CodingProblem> findAllByOrderByIdAsc();
}
