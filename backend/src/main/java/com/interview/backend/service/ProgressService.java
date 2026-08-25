package com.interview.backend.service;

import com.interview.backend.entity.UserProgress;
import com.interview.backend.repository.UserProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final UserProgressRepository repo;

    private UserProgress row(Long userId, String questionId) {
        return repo.findByUserIdAndQuestionId(userId, questionId).orElseGet(() -> {
            UserProgress p = new UserProgress();
            p.setUserId(userId);
            p.setQuestionId(questionId);
            return p;
        });
    }

    @Transactional
    public void markVisited(Long userId, String questionId) {
        UserProgress p = row(userId, questionId);
        p.setVisited(true);
        repo.save(p);
    }

    @Transactional
    public void markRead(Long userId, String questionId) {
        UserProgress p = row(userId, questionId);
        p.setRead(true);
        p.setVisited(true); // reading implies visiting
        repo.save(p);
    }

    // Merge guest ids from localStorage; never downgrades existing flags.
    @Transactional
    public void merge(Long userId, Collection<String> visited, Collection<String> read) {
        if (visited != null) visited.forEach(id -> markVisited(userId, id));
        if (read != null) read.forEach(id -> markRead(userId, id));
    }
}
