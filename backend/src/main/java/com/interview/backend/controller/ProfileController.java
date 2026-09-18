package com.interview.backend.controller;

import com.interview.backend.entity.Question;
import com.interview.backend.entity.User;
import com.interview.backend.entity.UserProgress;
import com.interview.backend.repository.QuestionRepository;
import com.interview.backend.repository.UserProgressRepository;
import com.interview.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.function.Predicate;

// Current-user profile: identity + progress. Auth required (locked in SecurityConfig).
// Context-path is already /api, so this maps to /api/profile/*.
@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final UserProgressRepository progressRepository;
    private final QuestionRepository questionRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me() {
        User u = currentUser();
        List<UserProgress> rows = progressRepository.findByUserId(u.getId());

        List<String> visitedIds = rows.stream().filter(UserProgress::isVisited).map(UserProgress::getQuestionId).toList();
        List<String> solvedIds = rows.stream().filter(UserProgress::isRead).map(UserProgress::getQuestionId).toList();
        long flaggedCount = rows.stream().filter(UserProgress::isFlagged).count();

        long total = questionRepository.count();

        List<Question> solvedQuestions = questionRepository.findAllById(solvedIds);

        // Per-tech breakdown: total questions vs how many this user has solved.
        Map<String, Long> solvedByTech = solvedQuestions.stream()
                .collect(Collectors.groupingBy(Question::getTech, Collectors.counting()));
        List<Map<String, Object>> byTech = new ArrayList<>();
        for (String tech : questionRepository.findDistinctTechs()) {
            byTech.add(Map.of(
                    "tech", tech,
                    "total", questionRepository.countByTech(tech),
                    "solved", solvedByTech.getOrDefault(tech, 0L)));
        }

        // Per-difficulty breakdown (Basic / Intermediate / Advanced / ...).
        Map<String, Long> solvedByDiff = solvedQuestions.stream()
                .filter(q -> q.getDifficulty() != null)
                .collect(Collectors.groupingBy(Question::getDifficulty, Collectors.counting()));
        List<Map<String, Object>> byDifficulty = new ArrayList<>();
        for (String diff : questionRepository.findDistinctDifficulties()) {
            byDifficulty.add(Map.of(
                    "difficulty", diff,
                    "total", questionRepository.countByDifficulty(diff),
                    "solved", solvedByDiff.getOrDefault(diff, 0L)));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", u.getEmail());
        body.put("name", u.getName() == null ? "" : u.getName());
        body.put("memberSince", u.getCreatedAt());
        body.put("totalQuestions", total);
        body.put("visitedCount", visitedIds.size());
        body.put("solvedCount", solvedIds.size());
        body.put("flaggedCount", flaggedCount);
        body.put("byTech", byTech);
        body.put("byDifficulty", byDifficulty);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/questions/solved")
    public ResponseEntity<List<Question>> solvedQuestions() {
        return ResponseEntity.ok(questionsFor(UserProgress::isRead));
    }

    @GetMapping("/questions/visited")
    public ResponseEntity<List<Question>> visitedQuestions() {
        return ResponseEntity.ok(questionsFor(UserProgress::isVisited));
    }

    @GetMapping("/questions/flagged")
    public ResponseEntity<List<Question>> flaggedQuestions() {
        return ResponseEntity.ok(questionsFor(UserProgress::isFlagged));
    }

    // Fetches full Question objects for progress rows belonging to the current user.
    private List<Question> questionsFor(Predicate<UserProgress> include) {
        Long userId = currentUser().getId();
        List<String> ids = progressRepository.findByUserId(userId).stream()
                .filter(include)
                .map(UserProgress::getQuestionId)
                .toList();
        return questionRepository.findAllById(ids);
    }
}
