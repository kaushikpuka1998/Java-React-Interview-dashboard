package com.interview.backend.repository;

import com.interview.backend.entity.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {
    List<UserProgress> findByUserId(Long userId);
    Optional<UserProgress> findByUserIdAndQuestionId(Long userId, String questionId);
}
