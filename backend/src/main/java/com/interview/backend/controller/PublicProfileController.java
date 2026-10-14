package com.interview.backend.controller;

import com.interview.backend.entity.Question;
import com.interview.backend.entity.User;
import com.interview.backend.entity.UserProgress;
import com.interview.backend.repository.QuestionRepository;
import com.interview.backend.repository.UserProgressRepository;
import com.interview.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Public progress page for a member. Only what a member would show on a CV: name,
 * join date and progress. Email, location and the flagged/important lists stay private.
 * Open to everyone (anyRequest permitAll), so it works while signed out.
 */
@RestController
@RequestMapping("/public/profiles")
@RequiredArgsConstructor
public class PublicProfileController {

    private final UserRepository users;
    private final UserProgressRepository progress;
    private final QuestionRepository questions;

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> profile(@PathVariable Long id) {
        User u = users.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();

        List<UserProgress> rows = progress.findByUserId(id);
        List<String> visited = rows.stream().filter(UserProgress::isVisited).map(UserProgress::getQuestionId).toList();
        List<String> solved = rows.stream().filter(UserProgress::isRead).map(UserProgress::getQuestionId).toList();
        List<Question> solvedQuestions = questions.findAllById(solved);

        Map<String, Long> solvedByTech = solvedQuestions.stream()
                .collect(Collectors.groupingBy(Question::getTech, Collectors.counting()));
        Map<String, Long> totalByTech = questions.countAllByTech().stream()
                .collect(Collectors.toMap(r -> (String) r[0], r -> ((Number) r[1]).longValue()));
        List<Map<String, Object>> byTech = new ArrayList<>();
        for (String tech : questions.findDistinctTechs()) {
            byTech.add(Map.of("tech", tech,
                    "total", totalByTech.getOrDefault(tech, 0L),
                    "solved", solvedByTech.getOrDefault(tech, 0L)));
        }

        Map<String, Long> solvedByDiff = solvedQuestions.stream().filter(q -> q.getDifficulty() != null)
                .collect(Collectors.groupingBy(Question::getDifficulty, Collectors.counting()));
        Map<String, Long> totalByDiff = questions.countAllByDifficulty().stream()
                .collect(Collectors.toMap(r -> (String) r[0], r -> ((Number) r[1]).longValue()));
        List<Map<String, Object>> byDifficulty = new ArrayList<>();
        for (String diff : questions.findDistinctDifficulties()) {
            byDifficulty.add(Map.of("difficulty", diff,
                    "total", totalByDiff.getOrDefault(diff, 0L),
                    "solved", solvedByDiff.getOrDefault(diff, 0L)));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", u.getName() == null || u.getName().isBlank() ? "Learner" : u.getName());
        body.put("memberSince", u.getCreatedAt());
        body.put("totalQuestions", questions.count());
        body.put("visitedCount", visited.size());
        body.put("solvedCount", solved.size());
        body.put("byTech", byTech);
        body.put("byDifficulty", byDifficulty);
        // The lists behind the Solved / Visited filter on the public page.
        body.put("solved", toItems(questions.findAllById(solved)));
        body.put("visited", toItems(questions.findAllById(visited)));
        return ResponseEntity.ok(body);
    }

    private static List<Map<String, Object>> toItems(List<Question> qs) {
        return qs.stream().map(q -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", q.getId());
            m.put("title", q.getTitle());
            m.put("tech", q.getTech());
            m.put("difficulty", q.getDifficulty());
            return m;
        }).toList();
    }
}
