package com.interview.backend.migration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.backend.entity.Question;
import com.interview.backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuestionMigrationService implements CommandLineRunner {

    private final QuestionRepository questionRepository;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.migration.json-path:classpath:questions.json}")
    private String jsonPath;

    @Value("${app.migration.batch-size:100}")
    private int batchSize;

    @Override
    @Transactional
    public void run(String... args) {
        if (questionRepository.count() > 0) {
            log.info("Database already contains {} questions. Skipping migration.", questionRepository.count());
            return;
        }

        log.info("Starting question migration from JSON...");
        try {
            migrateQuestions();
        } catch (Exception e) {
            log.error("Migration failed: {}", e.getMessage(), e);
            throw new RuntimeException("Migration failed", e);
        }
    }

    private void migrateQuestions() throws IOException {
        // Load the questions JSON from the classpath so it works both locally and
        // when packaged inside the application JAR.
        Resource resource = resourceLoader.getResource(jsonPath);

        if (!resource.exists()) {
            log.warn("JSON file not found at: {}", jsonPath);
            return;
        }

        log.info("Reading questions from: {}", jsonPath);
        String content;
        try (InputStream inputStream = resource.getInputStream()) {
            content = new String(inputStream.readAllBytes());
        }
        JsonNode rootNode = objectMapper.readTree(content);

        if (!rootNode.isArray()) {
            log.error("JSON root is not an array");
            return;
        }

        List<Question> batch = new ArrayList<>();
        int total = 0;
        int skipped = 0;

        for (JsonNode node : rootNode) {
            try {
                Question question = parseQuestion(node);
                if (question != null) {
                    if (!questionRepository.existsById(question.getId())) {
                        batch.add(question);
                    } else {
                        skipped++;
                    }

                    if (batch.size() >= batchSize) {
                        questionRepository.saveAll(batch);
                        total += batch.size();
                        log.info("Saved batch of {} questions. Total: {}", batch.size(), total);
                        batch.clear();
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse question: {}", e.getMessage());
            }
        }

        // Save remaining
        if (!batch.isEmpty()) {
            questionRepository.saveAll(batch);
            total += batch.size();
            log.info("Saved final batch of {} questions. Total: {}", batch.size(), total);
        }

        log.info("Migration complete! Total questions: {}, Skipped: {}", total, skipped);
    }

    private Question parseQuestion(JsonNode node) {
        String id = node.path("id").asText();
        if (id.isEmpty()) {
            return null;
        }

        return Question.builder()
                .id(id)
                .number(node.path("number").asInt(0))
                .displayNumber(node.path("displayNumber").asInt(node.path("number").asInt(0)))
                .sortKey(node.path("sortKey").asInt(node.path("displayNumber").asInt(node.path("number").asInt(0))))
                .title(node.path("title").asText(""))
                .question(node.path("question").asText(node.path("title").asText("")))
                .answer(node.path("answer").asText(""))
                .difficulty(node.path("difficulty").asText("Basic"))
                .category(node.path("category").asText(""))
                .tech(node.path("tech").asText("java"))
                .build();
    }
}