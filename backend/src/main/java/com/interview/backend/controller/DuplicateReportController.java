package com.interview.backend.controller;

import com.interview.backend.entity.DuplicateReport;
import com.interview.backend.entity.Question;
import com.interview.backend.entity.User;
import com.interview.backend.repository.DuplicateReportRepository;
import com.interview.backend.repository.QuestionRepository;
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
 * Reader-reported duplicate questions and the admin review queue behind them.
 *
 * Flow: reader flags a question as a duplicate -> PENDING -> admin either deletes
 * the question (report becomes RESOLVED) or dismisses the report (question stays,
 * report becomes DISMISSED).
 */
@RestController
@RequiredArgsConstructor
public class DuplicateReportController {

    private final DuplicateReportRepository reports;
    private final QuestionRepository questions;
    private final UserRepository users;
    private final QuestionService questionService;

    public record ReportRequest(String note) {}

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return users.findByEmail(email).orElseThrow();
    }

    /** Flag a question as a duplicate. Requires login to prevent spam and to attribute the report. */
    @PostMapping("/questions/{id}/duplicate-report")
    @Transactional
    public ResponseEntity<?> report(@PathVariable String id, @RequestBody(required = false) ReportRequest req) {
        if (!questions.existsById(id)) return ResponseEntity.notFound().build();

        User u = currentUser();
        if (reports.existsByQuestionIdAndUserIdAndStatus(id, u.getId(), DuplicateReport.PENDING)) {
            return ResponseEntity.badRequest().body(Map.of("error", "You've already reported this question"));
        }

        DuplicateReport r = new DuplicateReport();
        r.setQuestionId(id);
        r.setUserId(u.getId());
        r.setUserEmail(u.getEmail());
        String note = req == null ? null : trimOrNull(req.note());
        if (note != null && note.length() > 1000) {
            return ResponseEntity.badRequest().body(Map.of("error", "Note is too long"));
        }
        r.setNote(note);
        reports.save(r);

        return ResponseEntity.status(201).body(Map.of("message", "Thanks — an admin will review it."));
    }

    // ---------- admin (locked to ROLE_ADMIN in SecurityConfig) ----------

    @GetMapping("/duplicate-reports")
    public ResponseEntity<List<Map<String, Object>>> queue(@RequestParam(defaultValue = "PENDING") String status) {
        List<DuplicateReport> rows = reports.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
        // One query for all referenced questions, not one per report.
        List<String> ids = rows.stream().map(DuplicateReport::getQuestionId).distinct().toList();
        Map<String, Question> byId = ids.isEmpty() ? Map.of() : questions.findAllById(ids).stream()
                .collect(java.util.stream.Collectors.toMap(Question::getId, q -> q, (a, b) -> a));
        return ResponseEntity.ok(rows.stream().map(r -> toAdminView(r, byId.get(r.getQuestionId()))).toList());
    }

    @GetMapping("/duplicate-reports/counts")
    public ResponseEntity<Map<String, Long>> counts() {
        return ResponseEntity.ok(Map.of(
                "pending", reports.countByStatus(DuplicateReport.PENDING),
                "dismissed", reports.countByStatus(DuplicateReport.DISMISSED),
                "resolved", reports.countByStatus(DuplicateReport.RESOLVED)));
    }

    /** Confirms the duplicate: deletes the question and closes out the report. */
    @PostMapping("/duplicate-reports/{id}/delete-question")
    @Transactional
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id) {
        DuplicateReport r = reports.findById(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        if (!DuplicateReport.PENDING.equals(r.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Already " + r.getStatus().toLowerCase()));
        }
        try {
            questionService.delete(r.getQuestionId());
        } catch (IllegalArgumentException e) {
            // Already gone (e.g. another report on the same question resolved it first).
        }
        r.setStatus(DuplicateReport.RESOLVED);
        r.setReviewedAt(Instant.now());
        return ResponseEntity.ok(toAdminView(r));
    }

    /** Not actually a duplicate: leave the question as-is. */
    @PostMapping("/duplicate-reports/{id}/dismiss")
    @Transactional
    public ResponseEntity<?> dismiss(@PathVariable Long id) {
        DuplicateReport r = reports.findById(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        if (!DuplicateReport.PENDING.equals(r.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Already " + r.getStatus().toLowerCase()));
        }
        r.setStatus(DuplicateReport.DISMISSED);
        r.setReviewedAt(Instant.now());
        return ResponseEntity.ok(toAdminView(r));
    }

    private Map<String, Object> toAdminView(DuplicateReport r) {
        return toAdminView(r, questions.findById(r.getQuestionId()).orElse(null));
    }

    private Map<String, Object> toAdminView(DuplicateReport r, Question q) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("questionId", r.getQuestionId());
        m.put("questionTitle", q != null ? q.getTitle() : r.getQuestionId());
        m.put("tech", q != null ? q.getTech() : null);
        m.put("userEmail", r.getUserEmail());
        m.put("note", r.getNote());
        m.put("status", r.getStatus());
        m.put("createdAt", r.getCreatedAt());
        m.put("reviewedAt", r.getReviewedAt());
        return m;
    }

    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
