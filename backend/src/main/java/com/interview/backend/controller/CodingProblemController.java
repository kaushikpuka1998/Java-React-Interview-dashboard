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

    // One problem in a bulk import file. Test cases and templates are written as real JSON, not as strings.
    public record BulkProblem(String title, String difficulty, String statement, JsonNode testCases, JsonNode templates) {}

    private static final int MAX_BULK = 1000;

    /** Admin: saves many problems at once. Each one is checked like a single problem; the ones that fail are skipped and listed. */
    @PostMapping("/admin/coding-problems/bulk")
    public ResponseEntity<?> bulkCreate(@RequestBody List<BulkProblem> items) {
        if (items == null || items.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "The file has no problems."));
        if (items.size() > MAX_BULK) return ResponseEntity.badRequest().body(Map.of("error", "Import at most " + MAX_BULK + " problems at a time."));
        int saved = 0;
        List<Map<String, Object>> failed = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            BulkProblem b = items.get(i);
            String error;
            try {
                ProblemInput in = new ProblemInput(
                        b.title(), b.difficulty(), b.statement(),
                        jsonText(b.testCases()), null, null, jsonText(b.templates()));
                error = validate(in);
                if (error == null) {
                    CodingProblem p = new CodingProblem();
                    apply(p, in);
                    problems.save(p);
                    saved++;
                    continue;
                }
            } catch (JsonProcessingException e) {
                error = "Test cases or templates are not valid JSON.";
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("index", i);
            row.put("title", b.title() == null ? "" : b.title());
            row.put("error", error);
            failed.add(row);
        }
        return ResponseEntity.ok(Map.of("saved", saved, "failed", failed));
    }

    private static String jsonText(JsonNode node) throws JsonProcessingException {
        return node == null || node.isNull() ? null : json.writeValueAsString(node);
    }

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
            row.put("createdAt", p.getCreatedAt());
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

    /**
     * Admin: every problem as a bulk import file, so an export can be fed straight back into
     * /admin/coding-problems/bulk or into another environment. This is not the same as adminList:
     * that returns the rows as stored (id, createdAt, and JSON held in string columns), which the
     * import does not accept. Here testCases and templates are real JSON and the row identity is
     * dropped, leaving exactly the BulkProblem shape.
     *
     * Titles are not unique in the table, so duplicate rows export as duplicate entries. Importing
     * that file into a database that already holds those titles adds copies, because bulkCreate
     * always inserts; compare by title first.
     */
    @GetMapping("/admin/coding-problems/export")
    public List<BulkProblem> exportBulk() {
        List<BulkProblem> out = new ArrayList<>();
        for (CodingProblem p : problems.findAllByOrderByIdAsc()) {
            out.add(new BulkProblem(p.getTitle(), p.getDifficulty(), p.getStatement(),
                    readJson(p.getTestCases()), readJson(p.getTemplates())));
        }
        return out;
    }

    /** Parses a JSON string column, or null when it is empty or not valid JSON. */
    private static JsonNode readJson(String text) {
        if (text == null || text.isBlank()) return null;
        try {
            return json.readTree(text);
        } catch (JsonProcessingException e) {
            return null;
        }
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

    /** Code placed before the member's code, such as the TreeNode type for tree problems, or null. */
    public static String preludeFor(CodingProblem p, String language) {
        if (p.getTemplates() != null) {
            try {
                String pre = json.readTree(p.getTemplates()).path(language).path("prelude").asText(null);
                return pre == null || pre.isBlank() ? null : pre;
            } catch (JsonProcessingException e) {
                return null;
            }
        }
        return null;
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
