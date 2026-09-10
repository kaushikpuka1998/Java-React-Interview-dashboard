package com.interview.backend.controller;

import com.interview.backend.dto.QuestionInput;
import com.interview.backend.entity.Question;
import com.interview.backend.entity.Suggestion;
import com.interview.backend.entity.User;
import com.interview.backend.repository.QuestionRepository;
import com.interview.backend.repository.SuggestionRepository;
import com.interview.backend.repository.UserRepository;
import com.interview.backend.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reader-proposed edits to a question and the admin review queue behind them.
 *
 * Flow: reader submits -> PENDING -> admin approves (change is applied to the live
 * question and the reader is notified it is being published) or rejects (question
 * untouched; the row stays in the rejected archive with the admin's reason).
 */
@RestController
@RequiredArgsConstructor
public class SuggestionController {

    private final SuggestionRepository suggestions;
    private final QuestionRepository questions;
    private final UserRepository users;
    private final QuestionService questionService;

    public record SuggestRequest(String title, String question, String answer, String note) {}
    public record ReviewRequest(String adminNote) {}

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return users.findByEmail(email).orElseThrow();
    }

    // ---------- reader ----------

    /** Propose an edit. Requires login so the decision can be reported back. */
    @PostMapping("/questions/{id}/suggestions")
    @Transactional
    public ResponseEntity<?> suggest(@PathVariable String id, @RequestBody SuggestRequest req) {
        Question q = questions.findById(id).orElse(null);
        if (q == null) return ResponseEntity.notFound().build();

        String answer = trimOrNull(req.answer());
        String title = trimOrNull(req.title());
        String question = trimOrNull(req.question());
        if (answer == null && title == null && question == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nothing to change — edit the answer, question or title first"));
        }
        // Unchanged text is not a suggestion; reject it rather than queue a no-op.
        if (equalsCurrent(answer, q.getAnswer()) && equalsCurrent(title, q.getTitle()) && equalsCurrent(question, q.getQuestion())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This matches what is already published"));
        }
        if (req.note() != null && req.note().length() > 1000) {
            return ResponseEntity.badRequest().body(Map.of("error", "Note is too long"));
        }

        User u = currentUser();
        Suggestion s = new Suggestion();
        s.setQuestionId(id);
        s.setUserId(u.getId());
        s.setUserEmail(u.getEmail());
        // Store only what actually differs, so approving cannot overwrite an untouched field.
        s.setProposedTitle(equalsCurrent(title, q.getTitle()) ? null : title);
        s.setProposedQuestion(equalsCurrent(question, q.getQuestion()) ? null : question);
        s.setProposedAnswer(equalsCurrent(answer, q.getAnswer()) ? null : answer);
        s.setNote(trimOrNull(req.note()));
        suggestions.save(s);

        return ResponseEntity.status(201).body(Map.of(
                "status", Suggestion.PENDING,
                "message", "Sent to the admin for review. You'll be notified once it's decided."));
    }

    /** This reader's own suggestions, newest first — powers the notification bell. */
    @GetMapping("/suggestions/mine")
    public ResponseEntity<Map<String, Object>> mine() {
        Long userId = currentUser().getId();
        List<Suggestion> rows = suggestions.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(Map.of(
                "unseen", suggestions.countByUserIdAndSeenFalseAndStatusNot(userId, Suggestion.PENDING),
                "items", rows.stream().map(this::toReaderView).toList()));
    }

    /** Mark this reader's decided suggestions as read, clearing the badge. */
    @PostMapping("/suggestions/mine/seen")
    @Transactional
    public ResponseEntity<?> markSeen() {
        Long userId = currentUser().getId();
        suggestions.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(s -> !s.isSeen() && !Suggestion.PENDING.equals(s.getStatus()))
                .forEach(s -> s.setSeen(true));
        return ResponseEntity.ok(Map.of("unseen", 0));
    }

    // ---------- admin (locked to ROLE_ADMIN in SecurityConfig) ----------

    /** Review queue. status: PENDING (default), APPROVED or REJECTED (the archive). */
    @GetMapping("/suggestions")
    public ResponseEntity<List<Map<String, Object>>> queue(@RequestParam(defaultValue = "PENDING") String status) {
        List<Suggestion> rows = suggestions.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
        return ResponseEntity.ok(rows.stream().map(this::toAdminView).toList());
    }

    @GetMapping("/suggestions/counts")
    public ResponseEntity<Map<String, Long>> counts() {
        return ResponseEntity.ok(Map.of(
                "pending", suggestions.countByStatus(Suggestion.PENDING),
                "approved", suggestions.countByStatus(Suggestion.APPROVED),
                "rejected", suggestions.countByStatus(Suggestion.REJECTED)));
    }

    /** Approve: apply the proposed fields to the live question and notify the reader. */
    @PostMapping("/suggestions/{sid}/approve")
    @Transactional
    public ResponseEntity<?> approve(@PathVariable Long sid, @RequestBody(required = false) ReviewRequest req) {
        return decide(sid, Suggestion.APPROVED, req, s -> {
            questionService.update(s.getQuestionId(), new QuestionInput(
                    null, null, s.getProposedTitle(), s.getProposedQuestion(), s.getProposedAnswer(), null, null));
        });
    }

    /** Reject: the question stays as-is; the row moves to the rejected archive. */
    @PostMapping("/suggestions/{sid}/reject")
    @Transactional
    public ResponseEntity<?> reject(@PathVariable Long sid, @RequestBody(required = false) ReviewRequest req) {
        return decide(sid, Suggestion.REJECTED, req, s -> {});
    }

    private ResponseEntity<?> decide(Long sid, String status, ReviewRequest req, java.util.function.Consumer<Suggestion> apply) {
        Suggestion s = suggestions.findById(sid).orElse(null);
        if (s == null) return ResponseEntity.notFound().build();
        if (!Suggestion.PENDING.equals(s.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Already " + s.getStatus().toLowerCase()));
        }
        try {
            apply.accept(s);
        } catch (IllegalArgumentException e) {
            // The question was deleted since the suggestion was filed.
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
        s.setStatus(status);
        s.setAdminNote(req == null ? null : trimOrNull(req.adminNote()));
        s.setReviewedAt(Instant.now());
        s.setSeen(false);   // there is now a decision for the reader to see
        return ResponseEntity.ok(toAdminView(s));
    }

    // ---------- views ----------

    private Map<String, Object> toReaderView(Suggestion s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("questionId", s.getQuestionId());
        m.put("questionTitle", questions.findById(s.getQuestionId()).map(Question::getTitle).orElse(s.getQuestionId()));
        m.put("status", s.getStatus());
        m.put("note", s.getNote());
        m.put("adminNote", s.getAdminNote());
        m.put("seen", s.isSeen());
        m.put("createdAt", s.getCreatedAt());
        m.put("reviewedAt", s.getReviewedAt());
        return m;
    }

    private Map<String, Object> toAdminView(Suggestion s) {
        Question q = questions.findById(s.getQuestionId()).orElse(null);
        Map<String, Object> m = new LinkedHashMap<>(toReaderView(s));
        m.put("userEmail", s.getUserEmail());
        m.put("proposedTitle", s.getProposedTitle());
        m.put("proposedQuestion", s.getProposedQuestion());
        m.put("proposedAnswer", s.getProposedAnswer());
        m.put("currentTitle", q == null ? null : q.getTitle());
        m.put("currentQuestion", q == null ? null : q.getQuestion());
        m.put("currentAnswer", q == null ? null : q.getAnswer());
        m.put("tech", q == null ? null : q.getTech());
        return m;
    }

    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /** Null (not proposed) counts as "same as current" for the no-op check. */
    private static boolean equalsCurrent(String proposed, String current) {
        return proposed == null || proposed.equals(current == null ? null : current.trim());
    }
}
