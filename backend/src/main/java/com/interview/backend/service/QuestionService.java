package com.interview.backend.service;

import com.interview.backend.entity.Question;
import com.interview.backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class QuestionService {

    private final QuestionRepository questionRepository;

    public Optional<Question> getById(String id) {
        return questionRepository.findById(id);
    }

    public Page<Question> searchQuestions(String tech, String category, String difficulty,
                                          String search, String status, List<String> visitedIds, List<String> readIds, Pageable pageable) {
        // Provide empty lists if null to avoid JPQL IN clause issues
        List<String> v = visitedIds != null ? visitedIds : List.of();
        List<String> r = readIds != null ? readIds : List.of();
        return questionRepository.searchQuestions(tech, category, difficulty, search, status, v, r, pageable);
    }

    public List<String> getCategoriesByTech(String tech) {
        return questionRepository.findCategoriesByTech(tech);
    }

    public long getTotalCount() {
        return questionRepository.countAll();
    }

    public long getCountByTech(String tech) {
        return questionRepository.countByTech(tech);
    }

    @Transactional
    public Question save(Question question) {
        return questionRepository.save(question);
    }

    @Transactional
    public List<Question> saveAll(List<Question> questions) {
        return questionRepository.saveAll(questions);
    }

    public boolean existsById(String id) {
        return questionRepository.existsById(id);
    }
}