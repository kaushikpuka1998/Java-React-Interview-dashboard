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

import java.util.List;
import java.util.Map;

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
        long visited = rows.stream().filter(UserProgress::isVisited).count();
        long solved = rows.stream().filter(UserProgress::isRead).count();
        return ResponseEntity.ok(Map.of(
                "email", u.getEmail(),
                "name", u.getName() == null ? "" : u.getName(),
                "visitedCount", visited,
                "solvedCount", solved));
    }

    @GetMapping("/questions/solved")
    public ResponseEntity<List<Question>> solvedQuestions() {
        return ResponseEntity.ok(questionsFor(true));
    }

    @GetMapping("/questions/visited")
    public ResponseEntity<List<Question>> visitedQuestions() {
        return ResponseEntity.ok(questionsFor(false));
    }

    // read=true -> solved; read=false -> visited. Fetches the full Question objects for the user's ids.
    private List<Question> questionsFor(boolean read) {
        Long userId = currentUser().getId();
        List<String> ids = progressRepository.findByUserId(userId).stream()
                .filter(p -> read ? p.isRead() : p.isVisited())
                .map(UserProgress::getQuestionId)
                .toList();
        return questionRepository.findAllById(ids);
    }
}
