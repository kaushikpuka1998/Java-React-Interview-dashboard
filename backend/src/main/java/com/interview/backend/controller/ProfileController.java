package com.interview.backend.controller;

import com.interview.backend.entity.Question;
import com.interview.backend.entity.User;
import com.interview.backend.entity.UserNote;
import com.interview.backend.entity.UserProgress;
import com.interview.backend.repository.QuestionRepository;
import com.interview.backend.repository.UserProgressRepository;
import com.interview.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import com.interview.backend.service.GeoService;
import com.interview.backend.service.LocationRules;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final com.interview.backend.service.LeagueService leagues;
    private final com.interview.backend.service.UsernameService usernames;
    private final com.interview.backend.repository.UserNoteRepository userNotes;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me() {
        User u = currentUser();
        List<UserProgress> rows = liveRows(u.getId());

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
        body.put("id", u.getId());
        body.put("username", u.getUsername() == null ? "" : u.getUsername());
        body.put("email", u.getEmail());
        body.put("name", u.getName() == null ? "" : u.getName());
        body.put("memberSince", u.getCreatedAt());
        body.put("country", u.getCountry() == null ? "" : u.getCountry());
        body.put("city", u.getCity() == null ? "" : u.getCity());
        body.put("locationSource", u.getLocationSource() == null ? "" : u.getLocationSource());
        long xp = leagues.weeklyXp(u.getId());
        body.put("weeklyXp", xp);
        body.put("league", com.interview.backend.service.LeagueService.league(xp));
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

    public record NoteRequest(String title, String body) {}

    private static final int NOTE_BODY_MAX = 5000;
    private static final int NOTE_TITLE_MAX = 120;

    private static Map<String, Object> noteView(UserNote n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.getId());
        m.put("title", n.getTitle());
        m.put("body", n.getBody());
        m.put("createdAt", n.getCreatedAt());
        m.put("updatedAt", n.getUpdatedAt());
        return m;
    }

    /** Validates and normalises a note's title and body. Returns an error message, or null when valid. */
    private static String noteError(NoteRequest req) {
        String body = req.body() == null ? "" : req.body().strip();
        if (body.isEmpty()) return "Write something in the note first";
        if (body.length() > NOTE_BODY_MAX) return "Note is too long (max " + NOTE_BODY_MAX + " characters)";
        String title = req.title() == null ? "" : req.title().strip();
        if (title.length() > NOTE_TITLE_MAX) return "Title is too long (max " + NOTE_TITLE_MAX + " characters)";
        return null;
    }

    @GetMapping("/notes")
    public ResponseEntity<List<Map<String, Object>>> notes() {
        return ResponseEntity.ok(userNotes.findByUserIdOrderByUpdatedAtDesc(currentUser().getId())
                .stream().map(ProfileController::noteView).toList());
    }

    @PostMapping("/notes")
    public ResponseEntity<?> createNote(@RequestBody NoteRequest req) {
        String error = noteError(req);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));
        UserNote n = new UserNote();
        n.setUserId(currentUser().getId());
        n.setTitle(title(req));
        n.setBody(req.body().strip());
        return ResponseEntity.status(201).body(noteView(userNotes.save(n)));
    }

    @PutMapping("/notes/{id}")
    public ResponseEntity<?> updateNote(@PathVariable Long id, @RequestBody NoteRequest req) {
        String error = noteError(req);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));
        UserNote n = userNotes.findByIdAndUserId(id, currentUser().getId()).orElse(null);
        if (n == null) return ResponseEntity.notFound().build();
        n.setTitle(title(req));
        n.setBody(req.body().strip());
        n.setUpdatedAt(java.time.Instant.now());
        return ResponseEntity.ok(noteView(userNotes.save(n)));
    }

    @DeleteMapping("/notes/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id) {
        UserNote n = userNotes.findByIdAndUserId(id, currentUser().getId()).orElse(null);
        if (n == null) return ResponseEntity.notFound().build();
        userNotes.delete(n);
        return ResponseEntity.noContent().build();
    }

    private static String title(NoteRequest req) {
        String t = req.title() == null ? "" : req.title().strip();
        return t.isEmpty() ? "Untitled note" : t;
    }

    public record UsernameRequest(String username) {}

    /** Change your public handle. Taken names are refused; the old one stops resolving. */
    @PutMapping("/username")
    public ResponseEntity<Map<String, String>> updateUsername(@RequestBody UsernameRequest req) {
        User u = currentUser();
        String name;
        try {
            name = com.interview.backend.service.UsernameService.validate(req.username());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
        if (name.equals(u.getUsername())) return ResponseEntity.ok(Map.of("username", name));
        if (!usernames.isAvailable(name)) {
            return ResponseEntity.status(409).body(Map.of("error", "That username is taken"));
        }
        u.setUsername(name);
        userRepository.save(u);
        usernames.taken(name);
        return ResponseEntity.ok(Map.of("username", name));
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
    /** Progress rows whose question still exists. A deleted question's progress is ignored, not shown. */
    private List<UserProgress> liveRows(Long userId) {
        List<UserProgress> rows = progressRepository.findByUserId(userId);
        Set<String> live = questionRepository.findAllById(rows.stream().map(UserProgress::getQuestionId).toList())
                .stream().map(Question::getId).collect(Collectors.toSet());
        return rows.stream().filter(r -> live.contains(r.getQuestionId())).toList();
    }

    private List<Question> questionsFor(Predicate<UserProgress> include) {
        List<String> ids = liveRows(currentUser().getId()).stream()
                .filter(include)
                .map(UserProgress::getQuestionId)
                .toList();
        return new ArrayList<>(questionRepository.findAllById(ids));
    }
}
