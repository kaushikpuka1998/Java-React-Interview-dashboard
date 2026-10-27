package com.interview.backend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.backend.entity.CodingProblem;
import com.interview.backend.repository.CodingProblemRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * LeetCode-style problems. The public endpoints never return test cases; admins manage them under /admin.
 */
@RestController
public class CodingProblemController {

    public record ProblemInput(String title, String difficulty, String statement, String testCases, String starterCode, String driver, String templates) {}

    // "Input: ... Output: ..." examples written in a statement, e.g. "Input: 4 / 2 7 11 15 / 9" then "Output: 0 1".
    private static final Pattern EXAMPLE = Pattern.compile("Input:\\s*(.*?)\\s*Output:\\s*([^\\n]*)", Pattern.DOTALL);

    /** Test cases written in the statement as JSON, or null when the statement has no examples. */
    static String testsFromStatement(String statement) {
        if (statement == null) return null;
        List<Map<String, String>> tests = new ArrayList<>();
        Matcher m = EXAMPLE.matcher(statement);
        while (m.find()) {
            String input = m.group(1).replace("`", "").replace(" / ", "\n").strip();
            String expected = m.group(2).replace("`", "").strip();
            if (!input.isEmpty() && !expected.isEmpty()) tests.add(Map.of("input", input, "expected", expected));
        }
        if (tests.isEmpty()) return null;
        try {
            return json.writeValueAsString(tests);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    /** The test cases to store: the admin's JSON if given, otherwise the examples from the statement. */
    private static String resolveTests(ProblemInput in) {
        if (in.testCases() != null && !in.testCases().isBlank()) return in.testCases().trim();
        return testsFromStatement(in.statement());
    }

    private final CodingProblemRepository problems;

    private static final ObjectMapper json = new ObjectMapper();

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
            out.put("starters", startersOf(p));
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

    /** The starter code per language that members see. */
    static Map<String, String> startersOf(CodingProblem p) {
        Map<String, String> out = new LinkedHashMap<>();
        if (p.getTemplates() != null) {
            try {
                JsonNode root = json.readTree(p.getTemplates());
                root.fields().forEachRemaining(e -> out.put(e.getKey(), e.getValue().path("starter").asText("")));
            } catch (JsonProcessingException e) {
                // a bad template leaves the problem with no starters rather than breaking the page
            }
        } else if (p.getStarterCode() != null) {
            out.put("cpp", p.getStarterCode());
        }
        return out;
    }

    /** The hidden driver for one language, or null when the problem has none for it. */
    public static String driverFor(CodingProblem p, String language) {
        if (p.getTemplates() != null) {
            try {
                String d = json.readTree(p.getTemplates()).path(language).path("driver").asText(null);
                return d == null || d.isBlank() ? null : d;
            } catch (JsonProcessingException e) {
                return null;
            }
        }
        return "cpp".equals(language) ? p.getDriver() : null;
    }

    private static void apply(CodingProblem p, ProblemInput in) {
        p.setTitle(in.title().trim());
        p.setDifficulty(in.difficulty() == null || in.difficulty().isBlank() ? "Basic" : in.difficulty().trim());
        p.setStatement(in.statement().trim());
        p.setTestCases(resolveTests(in));
        p.setStarterCode(in.starterCode() == null || in.starterCode().isBlank() ? null : in.starterCode().stripTrailing());
        p.setDriver(in.driver() == null || in.driver().isBlank() ? null : in.driver().stripTrailing());
        p.setTemplates(in.templates() == null || in.templates().isBlank() ? null : in.templates().trim());
    }

    /** Returns an error message, or null when the input is valid. */
    private String validate(ProblemInput in) {
        if (in.title() == null || in.title().isBlank()) return "Title is required.";
        if (in.title().length() > 300) return "Title is too long (max 300 characters).";
        if (in.statement() == null || in.statement().isBlank()) return "The problem statement is required.";
        if (in.templates() != null && !in.templates().isBlank()) {
            try {
                JsonNode t = json.readTree(in.templates().trim());
                if (!t.isObject()) return "Language templates must be a JSON object.";
            } catch (JsonProcessingException e) {
                return "Language templates are not valid JSON.";
            }
        }
        String tests = resolveTests(in);
        if (tests == null) return "Add test cases, or write an example in the statement as \"Input: ... Output: ...\".";
        try {
            JsonNode n = json.readTree(tests);
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
