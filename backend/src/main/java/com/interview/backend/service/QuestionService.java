package com.interview.backend.service;

import com.interview.backend.config.CachedPage;
import com.interview.backend.entity.Question;
import com.interview.backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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

    @Cacheable("questionById")
    public Optional<Question> getById(String id) {
        return questionRepository.findById(id);
    }

    // Cache only user-independent browses (status == null). Status filters depend on
    // per-user visited/read ids, which would pollute the cache, so those skip it.
    @Cacheable(value = "questionSearch",
            key = "#tech + '|' + #category + '|' + #difficulty + '|' + #search + '|' + #pageable.pageNumber + '|' + #pageable.pageSize + '|' + #pageable.sort",
            condition = "#status == null")
    public Page<Question> searchQuestions(String tech, String category, String difficulty,
                                          String search, String status, List<String> visitedIds, List<String> readIds, Pageable pageable) {
        // Provide empty lists if null to avoid JPQL IN clause issues
        List<String> v = visitedIds != null ? visitedIds : List.of();
        List<String> r = readIds != null ? readIds : List.of();
        Page<Question> page = questionRepository.searchQuestions(tech, category, difficulty, search, status, v, r, pageable);
        // Wrap so the cached value serializes to / from JSON cleanly.
        return CachedPage.of(page);
    }

    @Cacheable("categories")
    public List<String> getCategoriesByTech(String tech) {
        return questionRepository.findCategoriesByTech(tech);
    }

    @Cacheable(value = "stats", key = "'total'")
    public long getTotalCount() {
        return questionRepository.countAll();
    }

    @Cacheable(value = "stats", key = "#tech")
    public long getCountByTech(String tech) {
        return questionRepository.countByTech(tech);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "questionSearch", allEntries = true),
            @CacheEvict(value = "categories", allEntries = true),
            @CacheEvict(value = "stats", allEntries = true),
            @CacheEvict(value = "questionById", allEntries = true)
    })
    public Question save(Question question) {
        return questionRepository.save(question);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "questionSearch", allEntries = true),
            @CacheEvict(value = "categories", allEntries = true),
            @CacheEvict(value = "stats", allEntries = true),
            @CacheEvict(value = "questionById", allEntries = true)
    })
    public List<Question> saveAll(List<Question> questions) {
        return questionRepository.saveAll(questions);
    }

    public boolean existsById(String id) {
        return questionRepository.existsById(id);
    }
}