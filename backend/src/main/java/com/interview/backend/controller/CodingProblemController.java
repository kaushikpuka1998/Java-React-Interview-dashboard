package com.interview.backend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.backend.entity.CodingProblem;
import com.interview.backend.repository.CodingProblemRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * LeetCode-style problems. The public endpoints never return test cases; admins manage them under /admin.
 */
@RestController
public class CodingProblemController {

    public record ProblemInput(String title, String difficulty, String statement, String testCases) {}

    private final CodingProblemRepository problems;
    private final ObjectMapper json = new ObjectMapper();

    public CodingProblemController(CodingProblemRepository problems) {
        this.problems = problems;
    }

    /** Public list: id, title and difficulty only. */
    @GetMapping("/coding-problems")
    public List<Map<String, Object>> list() {
        return problems.findAllByOrderByIdAsc().stream().map(p -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", p.getId());
            row.put("title", p.getTitle());
            row.put("difficulty", p.getDifficulty() == null ? "" : p.getDifficulty());
            return row;
        }).toList();
    }

    /** Public detail: the statement, without test cases. */
    @GetMapping("/coding-problems/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        return problems.findById(id).<ResponseEntity<?>>map(p -> {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("id", p.getId());
            out.put("title", p.getTitle());
            out.put("difficulty", p.getDifficulty() == null ? "" : p.getDifficulty());
            out.put("statement", p.getStatement());
            return ResponseEntity.ok(out);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Admin: full problems, including test cases, for editing. */
    @GetMapping("/admin/coding-problems")
    public List<CodingProblem> adminList() {
        return problems.findAllByOrderByIdAsc();
    }

    @PostMapping("/admin/coding-problems")
    public ResponseEntity<?> create(@RequestBody ProblemInput in) {
        String error = validate(in);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));
        CodingProblem p = new CodingProblem();
        apply(p, in);
        return ResponseEntity.status(201).body(problems.save(p));
    }

    @PutMapping("/admin/coding-problems/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ProblemInput in) {
        CodingProblem p = problems.findById(id).orElse(null);
        if (p == null) return ResponseEntity.notFound().build();
        String error = validate(in);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));
        apply(p, in);
        return ResponseEntity.ok(problems.save(p));
    }

    @DeleteMapping("/admin/coding-problems/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!problems.existsById(id)) return ResponseEntity.notFound().build();
        problems.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private static void apply(CodingProblem p, ProblemInput in) {
        p.setTitle(in.title().trim());
        p.setDifficulty(in.difficulty() == null || in.difficulty().isBlank() ? "Basic" : in.difficulty().trim());
        p.setStatement(in.statement().trim());
        p.setTestCases(in.testCases().trim());
    }

    /** Returns an error message, or null when the input is valid. */
    private String validate(ProblemInput in) {
        if (in.title() == null || in.title().isBlank()) return "Title is required.";
        if (in.title().length() > 300) return "Title is too long (max 300 characters).";
        if (in.statement() == null || in.statement().isBlank()) return "The problem statement is required.";
        if (in.testCases() == null || in.testCases().isBlank()) return "Add at least one test case.";
        try {
            JsonNode n = json.readTree(in.testCases().trim());
            if (!n.isArray() || n.isEmpty()) return "Test cases must be a non-empty JSON list.";
            for (JsonNode t : n) {
                if (!t.isObject() || !t.has("expected")) return "Each test case needs an \"expected\" value.";
            }
        } catch (JsonProcessingException e) {
            return "Test cases must be valid JSON, for example [{\"input\": \"2 3\", \"expected\": \"5\"}].";
        }
        return null;
    }
}
