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
import com.interview.backend.service.GeoService;
import com.interview.backend.service.LocationRules;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
        List<String> flaggedIds = rows.stream().filter(UserProgress::isFlagged).map(UserProgress::getQuestionId).toList();
        long importantCount = rows.stream().filter(UserProgress::isImportant).count();

        long total = questionRepository.count();

        List<Question> solvedQuestions = questionRepository.findAllById(solvedIds);

        // Per-tech breakdown: total questions vs how many this user has solved.
        Map<String, Long> solvedByTech = solvedQuestions.stream()
                .collect(Collectors.groupingBy(Question::getTech, Collectors.counting()));
        Map<String, Long> totalByTech = questionRepository.countAllByTech().stream()
                .collect(Collectors.toMap(r -> (String) r[0], r -> ((Number) r[1]).longValue()));
        List<Map<String, Object>> byTech = new ArrayList<>();
        for (String tech : questionRepository.findDistinctTechs()) {
            byTech.add(Map.of(
                    "tech", tech,
                    "total", totalByTech.getOrDefault(tech, 0L),
                    "solved", solvedByTech.getOrDefault(tech, 0L)));
        }

        // Per-difficulty breakdown (Basic / Intermediate / Advanced / ...).
        Map<String, Long> solvedByDiff = solvedQuestions.stream()
                .filter(q -> q.getDifficulty() != null)
                .collect(Collectors.groupingBy(Question::getDifficulty, Collectors.counting()));
        Map<String, Long> totalByDiff = questionRepository.countAllByDifficulty().stream()
                .collect(Collectors.toMap(r -> (String) r[0], r -> ((Number) r[1]).longValue()));
        List<Map<String, Object>> byDifficulty = new ArrayList<>();
        for (String diff : questionRepository.findDistinctDifficulties()) {
            byDifficulty.add(Map.of(
                    "difficulty", diff,
                    "total", totalByDiff.getOrDefault(diff, 0L),
                    "solved", solvedByDiff.getOrDefault(diff, 0L)));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", u.getEmail());
        body.put("name", u.getName() == null ? "" : u.getName());
        body.put("memberSince", u.getCreatedAt());
        body.put("country", u.getCountry() == null ? "" : u.getCountry());
        body.put("city", u.getCity() == null ? "" : u.getCity());
        body.put("locationSource", u.getLocationSource() == null ? "" : u.getLocationSource());
        body.put("totalQuestions", total);
        body.put("visitedCount", visitedIds.size());
        body.put("solvedCount", solvedIds.size());
        body.put("flaggedCount", flaggedIds.size());
        body.put("importantCount", importantCount);
        body.put("byTech", byTech);
        body.put("byDifficulty", byDifficulty);
        return ResponseEntity.ok(body);
    }

    public record LocationRequest(String country, String city) {}

    /** User-entered location; overrides the IP guess. Both fields are required and validated. */
    @PutMapping("/location")
    public ResponseEntity<Map<String, String>> updateLocation(@RequestBody LocationRequest req) {
        User u = currentUser();
        LocationRules.Location loc;
        try {
            loc = LocationRules.validate(req.country(), req.city());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
        GeoService.applyUserLocation(u, loc.country(), loc.city());
        userRepository.save(u);
        return ResponseEntity.ok(Map.of(
                "country", u.getCountry() == null ? "" : u.getCountry(),
                "city", u.getCity() == null ? "" : u.getCity(),
                "locationSource", u.getLocationSource() == null ? "" : u.getLocationSource()));
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

    @GetMapping("/questions/important")
    public ResponseEntity<List<Question>> importantQuestions() {
        return ResponseEntity.ok(questionsFor(UserProgress::isImportant));
    }

    // Fetches full Question objects for progress rows belonging to the current user.
    private List<Question> questionsFor(Predicate<UserProgress> include) {
        Long userId = currentUser().getId();
        List<String> ids = progressRepository.findByUserId(userId).stream()
                .filter(include)
                .map(UserProgress::getQuestionId)
                .toList();
        List<Question> found = new ArrayList<>(questionRepository.findAllById(ids));
        if (found.size() < ids.size()) {
            List<String> foundIds = found.stream().map(Question::getId).toList();
            for (String id : ids) {
                if (!foundIds.contains(id)) {
                    Question q = new Question();
                    q.setId(id);
                    q.setTitle("Deleted Question");
                    q.setTech("unknown");
                    found.add(q);
                }
            }
        }
        return found;
    }
}
