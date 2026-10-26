package com.interview.backend.code;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Sends code to a Judge0 server, which runs it in its own sandbox. Our app server never runs user code.
 * Configure with APP_JUDGE0_URL (e.g. https://judge.example.com) and APP_JUDGE0_TOKEN.
 */
@Service
public class CodeRunner {

    public record Result(String status, String stdout, String stderr, String compileOutput, String time, Integer memoryKb) {}

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ObjectMapper json;
    private final String url;
    private final String token;

    public CodeRunner(ObjectMapper json, @Value("${app.judge0.url:}") String url, @Value("${app.judge0.token:}") String token) {
        this.json = json;
        this.url = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
        this.token = token;
    }

    public boolean configured() {
        return !url.isBlank();
    }

    public Result run(CodeLanguages.Language lang, String source, String stdin) throws IOException, InterruptedException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("language_id", lang.judge0Id());
        body.put("source_code", b64(source));
        body.put("stdin", b64(stdin));
        body.put("cpu_time_limit", lang.cpuSeconds());      // seconds of CPU for the program
        body.put("wall_time_limit", lang.cpuSeconds() + 5);  // seconds of real time, including compile
        body.put("memory_limit", lang.memoryKb());   // KB, per language
        body.put("enable_network", false);
        // Per-process limits avoid Judge0's cgroup mode, which needs cgroups v1 (Ubuntu and Docker Desktop default to v2).
        body.put("enable_per_process_and_thread_time_limit", true);
        body.put("enable_per_process_and_thread_memory_limit", true);

        HttpRequest.Builder req = HttpRequest.newBuilder(URI.create(url + "/submissions?base64_encoded=true&wait=true"))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        if (!token.isBlank()) req.header("X-Auth-Token", token);

        HttpResponse<String> res = http.send(req.build(), HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 300) throw new IOException("Judge0 returned HTTP " + res.statusCode());

        JsonNode n = json.readTree(res.body());
        String time = n.path("time").isTextual() ? n.path("time").asText() : null;
        Integer memory = n.path("memory").isNumber() ? n.path("memory").asInt() : null;
        return new Result(
                n.path("status").path("description").asText("Unknown"),
                decode(n, "stdout"),
                decode(n, "stderr"),
                decode(n, "compile_output"),
                time,
                memory);
    }

    private static String b64(String s) {
        return Base64.getEncoder().encodeToString((s == null ? "" : s).getBytes(StandardCharsets.UTF_8));
    }

    private static String decode(JsonNode n, String field) {
        JsonNode v = n.path(field);
        return v.isTextual() ? new String(Base64.getMimeDecoder().decode(v.asText()), StandardCharsets.UTF_8) : "";
    }
}
