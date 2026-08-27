package com.interview.backend.controller;

import com.interview.backend.entity.Company;
import com.interview.backend.entity.QuestionCompany;
import com.interview.backend.entity.User;
import com.interview.backend.repository.CompanyRepository;
import com.interview.backend.repository.QuestionCompanyRepository;
import com.interview.backend.repository.QuestionRepository;
import com.interview.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyRepository companies;
    private final QuestionCompanyRepository reports;
    private final QuestionRepository questions;
    private final UserRepository users;

    public record AskedAtRequest(String company, String askedOn) {}

    private Long currentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return users.findByEmail(email).map(User::getId).orElseThrow();
    }

    // ---------- typeahead over companies already in the database ----------

    /**
     * Autocomplete source. The client shows these matches; if none fit, the typed
     * text is submitted as-is and a new company row is created on report.
     */
    @GetMapping("/companies")
    public ResponseEntity<List<String>> search(@RequestParam(required = false) String q,
                                               @RequestParam(defaultValue = "10") int limit) {
        int n = Math.min(Math.max(limit, 1), 25);
        List<Company> found = (q == null || q.isBlank())
                // No query yet: offer the most commonly reported companies as suggestions.
                ? companies.mostReported(PageRequest.of(0, n)).stream()
                    .map(r -> { Company c = new Company(); c.setName((String) r[0]); return c; })
                    .collect(Collectors.toList())
                : companies.search(q.trim().toLowerCase(), PageRequest.of(0, n));

        return ResponseEntity.ok(found.stream().map(Company::getName).collect(Collectors.toList()));
    }

    // ---------- per-question company reports ----------

    /** Public: which companies this question has been reported at, with counts. */
    @GetMapping("/questions/{id}/companies")
    public ResponseEntity<List<Map<String, Object>>> forQuestion(@PathVariable String id) {
        List<Map<String, Object>> out = reports.companiesForQuestion(id).stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("company", r[0]);
            m.put("reports", ((Number) r[1]).longValue());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    /**
     * Report that this question was asked at a company. Requires login so each
     * person counts once. The company is reused when it already exists, otherwise
     * it is created from the typed name.
     */
    @PostMapping("/questions/{id}/companies")
    @Transactional
    public ResponseEntity<?> report(@PathVariable String id, @RequestBody AskedAtRequest req) {
        String raw = req.company() == null ? "" : req.company().trim();
        if (raw.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Company name is required"));
        }
        if (raw.length() > 120) {
            return ResponseEntity.badRequest().body(Map.of("error", "Company name is too long"));
        }
        if (!questions.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        Company company = findOrCreate(raw);
        Long userId = currentUserId();

        // Same person reporting the same pair again is a no-op, not an error.
        if (reports.findByQuestionIdAndCompanyIdAndUserId(id, company.getId(), userId).isEmpty()) {
            QuestionCompany qc = new QuestionCompany();
            qc.setQuestionId(id);
            qc.setCompanyId(company.getId());
            qc.setUserId(userId);
            qc.setAskedOn(req.askedOn() == null || req.askedOn().isBlank() ? null : req.askedOn().trim());
            reports.save(qc);
        }
        return forQuestion(id);
    }

    /** Withdraw this user's own report. */
    @DeleteMapping("/questions/{id}/companies/{name}")
    @Transactional
    public ResponseEntity<?> unreport(@PathVariable String id, @PathVariable String name) {
        Long userId = currentUserId();
        return companies.findBySlug(Company.toSlug(name))
                .flatMap(c -> reports.findByQuestionIdAndCompanyIdAndUserId(id, c.getId(), userId))
                .map(r -> { reports.delete(r); return forQuestion(id); })
                .orElseGet(() -> forQuestion(id));
    }

    /** Reuse the existing row when the normalised name already exists. */
    private Company findOrCreate(String raw) {
        String slug = Company.toSlug(raw);
        return companies.findBySlug(slug).orElseGet(() -> {
            try {
                return companies.saveAndFlush(new Company(raw, slug));
            } catch (DataIntegrityViolationException e) {
                // Lost a race with a concurrent insert — take the row that won.
                return companies.findBySlug(slug).orElseThrow();
            }
        });
    }
}
