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

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "questionSearch", allEntries = true),
            @CacheEvict(value = "categories", allEntries = true),
            @CacheEvict(value = "stats", allEntries = true),
            @CacheEvict(value = "questionById", allEntries = true)
    })
    public List<Question> createFromInputs(List<com.interview.backend.dto.QuestionInput> inputs) {
        int sortKey = questionRepository.maxSortKey();
        // Track the running max number per tech so a bulk push assigns sequential numbers.
        java.util.Map<String, Integer> nextNumber = new java.util.HashMap<>();
        List<Question> toSave = new java.util.ArrayList<>();

        for (com.interview.backend.dto.QuestionInput in : inputs) {
            if (in.tech() == null || in.tech().isBlank())
                throw new IllegalArgumentException("tech is required");
            if (in.title() == null || in.title().isBlank())
                throw new IllegalArgumentException("title is required");
            if (in.answer() == null || in.answer().isBlank())
                throw new IllegalArgumentException("answer is required");

            String tech = in.tech().trim().toLowerCase();
            int number = nextNumber.computeIfAbsent(tech, questionRepository::maxNumberByTech) + 1;
            nextNumber.put(tech, number);
            sortKey++;

            String id = (in.id() == null || in.id().isBlank()) ? tech + "-" + number : in.id().trim();
            if (questionRepository.existsById(id))
                throw new IllegalArgumentException("Question id already exists: " + id);

            String questionText = (in.question() == null || in.question().isBlank()) ? in.title() : in.question();

            toSave.add(Question.builder()
                    .id(id)
                    .number(number)
                    .displayNumber(number)
                    .sortKey(sortKey)
                    .title(in.title().trim())
                    .question(questionText)
                    .answer(in.answer())
                    .difficulty(in.difficulty() == null || in.difficulty().isBlank() ? "Basic" : in.difficulty())
                    .category(in.category() == null ? "" : in.category())
                    .tech(tech)
                    .build());
        }
        return questionRepository.saveAll(toSave);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "questionSearch", allEntries = true),
            @CacheEvict(value = "categories", allEntries = true),
            @CacheEvict(value = "stats", allEntries = true),
            @CacheEvict(value = "questionById", allEntries = true)
    })
    public Question update(String id, com.interview.backend.dto.QuestionInput in) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + id));
        // Only overwrite fields the admin actually supplied.
        if (in.title() != null && !in.title().isBlank()) q.setTitle(in.title().trim());
        if (in.question() != null && !in.question().isBlank()) q.setQuestion(in.question());
        if (in.answer() != null && !in.answer().isBlank()) q.setAnswer(in.answer());
        if (in.difficulty() != null && !in.difficulty().isBlank()) q.setDifficulty(in.difficulty());
        if (in.category() != null) q.setCategory(in.category());
        if (in.tech() != null && !in.tech().isBlank()) q.setTech(in.tech().trim().toLowerCase());
        return questionRepository.save(q);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "questionSearch", allEntries = true),
            @CacheEvict(value = "categories", allEntries = true),
            @CacheEvict(value = "stats", allEntries = true),
            @CacheEvict(value = "questionById", allEntries = true)
    })
    public void delete(String id) {
        if (!questionRepository.existsById(id))
            throw new IllegalArgumentException("Question not found: " + id);
        questionRepository.deleteById(id);
    }
}