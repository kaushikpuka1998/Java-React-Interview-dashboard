package com.interview.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.backend.code.CodeJobs;
import com.interview.backend.code.CodeLanguages;
import com.interview.backend.code.CodeRunner;
import com.interview.backend.entity.CodingProblem;
import com.interview.backend.repository.CodingProblemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/** Runs code for a signed-in user, either once or against a coding problem's tests, through a queue. */
@RestController
@RequestMapping("/code")
public class CodeController {

    private static final Logger log = LoggerFactory.getLogger(CodeController.class);

    public record RunRequest(String language, String code, String stdin) {}
    public record TestRequest(Long problemId, String language, String code) {}

    private static final int MAX_CODE = 20_000;
    private static final int MAX_STDIN = 4_000;
    private static final int MAX_TESTS = 20;
    private static final int RUNS_PER_MINUTE = 12;

    private final CodeRunner runner;
    private final CodingProblemRepository problems;
    private final CodeJobs jobs;
    private final ObjectMapper json = new ObjectMapper();
    // user -> [windowStartMillis, count]
    private final Map<String, long[]> windows = new ConcurrentHashMap<>();

    public CodeController(CodeRunner runner, CodingProblemRepository problems, CodeJobs jobs) {
        this.runner = runner;
        this.problems = problems;
        this.jobs = jobs;
    }

    @PostMapping("/run")
    public ResponseEntity<?> run(@RequestBody RunRequest req, Authentication auth) {
        if (!runner.configured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", "The code runner isn't set up yet."));
        }
        CodeLanguages.Language lang = CodeLanguages.find(req.language() == null ? "" : req.language()).orElse(null);
        if (lang == null) return ResponseEntity.badRequest().body(Map.of("error", "That language isn't supported."));
        if (req.code() == null || req.code().isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Write some code first."));
        if (req.code().length() > MAX_CODE) return ResponseEntity.badRequest().body(Map.of("error", "The code is too long (max 20,000 characters)."));
        if (req.stdin() != null && req.stdin().length() > MAX_STDIN) return ResponseEntity.badRequest().body(Map.of("error", "The input is too long (max 4,000 characters)."));
        if (!allow(auth.getName(), 1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", "Too many runs. Wait a minute and try again."));
        }
        String stdin = req.stdin() == null ? "" : req.stdin();
        return enqueue(auth.getName(), () -> runOnce(lang, req.code(), stdin));
    }

    /**
     * Runs the code once per test case of the coding problem and compares the output (line endings and
     * trailing spaces ignored). Expected and actual outputs are not returned, only pass or fail.
     */
    @PostMapping("/test")
    public ResponseEntity<?> test(@RequestBody TestRequest req, Authentication auth) {
        if (!runner.configured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", "The code runner isn't set up yet."));
        }
        CodeLanguages.Language lang = CodeLanguages.find(req.language() == null ? "" : req.language()).orElse(null);
        if (lang == null) return ResponseEntity.badRequest().body(Map.of("error", "That language isn't supported."));
        if (req.code() == null || req.code().isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Write some code first."));
        if (req.code().length() > MAX_CODE) return ResponseEntity.badRequest().body(Map.of("error", "The code is too long (max 20,000 characters)."));

        CodingProblem p = req.problemId() == null ? null : problems.findById(req.problemId()).orElse(null);
        if (p == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Problem not found."));

        List<Map<String, Object>> tests;
        try {
            tests = json.readValue(p.getTestCases(), new TypeReference<List<Map<String, Object>>>() {});
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "This problem's test cases are not valid."));
        }
        if (tests.size() > MAX_TESTS) return ResponseEntity.badRequest().body(Map.of("error", "This problem has too many test cases."));
        if (!allow(auth.getName(), tests.size())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", "Too many runs. Wait a minute and try again."));
        }
        return enqueue(auth.getName(), () -> runTests(lang, req.code(), tests));
    }

    /** Status of a queued job: QUEUED (with its place in line), RUNNING, or DONE (with the result). */
    @GetMapping("/jobs/{id}")
    public ResponseEntity<?> job(@PathVariable String id, Authentication auth) {
        CodeJobs.Job job = jobs.find(id, auth.getName());
        if (job == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "This run was not found. Try again."));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("state", job.state().name());
        if (job.state() == CodeJobs.State.QUEUED) out.put("position", jobs.position(job));
        if (job.state() == CodeJobs.State.DONE && job.outcome() != null) {
            out.put("httpStatus", job.outcome().httpStatus());
            out.put("body", job.outcome().body());
        }
        return ResponseEntity.ok(out);
    }

    private ResponseEntity<?> enqueue(String user, java.util.function.Supplier<CodeJobs.Outcome> task) {
        try {
            CodeJobs.Job job = jobs.submit(user, task);
            return ResponseEntity.accepted().body(Map.of("jobId", job.id(), "state", "QUEUED"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", "The code runner is busy. Try again in a moment."));
        }
    }

    private CodeJobs.Outcome runOnce(CodeLanguages.Language lang, String code, String stdin) {
        try {
            CodeRunner.Result r = runner.run(lang, code, stdin);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("status", r.status());
            out.put("stdout", r.stdout());
            out.put("stderr", r.stderr());
            out.put("compileOutput", r.compileOutput());
            out.put("time", r.time());
            out.put("memoryKb", r.memoryKb());
            return new CodeJobs.Outcome(200, out);
        } catch (IOException e) {
            log.warn("Code runner call failed: {}", e.getMessage());
            return new CodeJobs.Outcome(502, Map.of("error", "The code runner is unavailable right now."));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new CodeJobs.Outcome(503, Map.of("error", "The run was interrupted. Try again."));
        }
    }

    private CodeJobs.Outcome runTests(CodeLanguages.Language lang, String code, List<Map<String, Object>> tests) {
        List<Map<String, Object>> results = new ArrayList<>();
        int passed = 0;
        try {
            for (int i = 0; i < tests.size(); i++) {
                Map<String, Object> t = tests.get(i);
                String input = String.valueOf(t.getOrDefault("input", ""));
                String expected = String.valueOf(t.getOrDefault("expected", ""));
                CodeRunner.Result r = runner.run(lang, code, input);
                boolean ok = "Accepted".equals(r.status()) && normalize(r.stdout()).equals(normalize(expected));
                if (ok) passed++;
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("number", i + 1);
                row.put("passed", ok);
                row.put("status", r.status());
                results.add(row);
            }
        } catch (IOException e) {
            log.warn("Code runner call failed: {}", e.getMessage());
            return new CodeJobs.Outcome(502, Map.of("error", "The code runner is unavailable right now."));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new CodeJobs.Outcome(503, Map.of("error", "The run was interrupted. Try again."));
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("passed", passed);
        out.put("total", tests.size());
        out.put("results", results);
        return new CodeJobs.Outcome(200, out);
    }

    // Line endings and trailing spaces don't count as differences.
    static String normalize(String s) {
        if (s == null) return "";
        return s.lines().map(String::stripTrailing).collect(Collectors.joining("\n")).strip();
    }

    private boolean allow(String user, int runs) {
        long now = System.currentTimeMillis();
        long[] w = windows.compute(user, (k, v) ->
                (v == null || now - v[0] >= 60_000) ? new long[]{now, runs} : new long[]{v[0], v[1] + runs});
        if (windows.size() > 10_000) windows.clear();
        return w[1] <= RUNS_PER_MINUTE;
    }
}
