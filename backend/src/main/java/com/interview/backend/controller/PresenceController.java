package com.interview.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * "Online now": each visitor sends a ping every 30 seconds, and anyone pinged within the last
 * two minutes counts as online. A signed-in person is counted once, by account, however many
 * tabs or browsers they use. Anonymous visitors are counted once per browser, by session id.
 * The counts live in memory, so they reset when the server restarts.
 */
@RestController
@RequestMapping("/presence")
public class PresenceController {

    private static final Duration WINDOW = Duration.ofMinutes(2);
    private final Map<String, Instant> lastSeen = new ConcurrentHashMap<>();

    /** Public: anonymous visitors are part of the count. Never returns an error to the page. */
    @PostMapping("/ping")
    public ResponseEntity<Void> ping(@RequestBody(required = false) Map<String, String> body) {
        String key = visitorKey(body == null ? null : body.get("sessionId"));
        if (key != null) lastSeen.put(key, Instant.now());
        return ResponseEntity.noContent().build();
    }

    /** Public: only the number is returned, never who is online. */
    @GetMapping("/count")
    public Map<String, Integer> count() {
        Instant cutoff = Instant.now().minus(WINDOW);
        lastSeen.values().removeIf(seen -> seen.isBefore(cutoff));
        return Map.of("online", lastSeen.size());
    }

    /** For the admin analytics page only (see AnalyticsController): who is online, newest activity first. Members by email, visitors only as a number. */
    public Map<String, Object> snapshot() {
        Instant cutoff = Instant.now().minus(WINDOW);
        lastSeen.values().removeIf(seen -> seen.isBefore(cutoff));
        java.util.List<Map<String, Object>> members = new java.util.ArrayList<>();
        int visitors = 0;
        for (Map.Entry<String, Instant> e : lastSeen.entrySet()) {
            if (e.getKey().startsWith("u:")) {
                Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("email", e.getKey().substring(2));
                m.put("lastSeen", e.getValue().toString());
                members.add(m);
            } else visitors++;
        }
        members.sort((a, b) -> ((String) b.get("lastSeen")).compareTo((String) a.get("lastSeen")));
        return Map.of("members", members, "visitors", visitors);
    }

    private String visitorKey(String sessionId) {
        String email = signedInEmail();
        if (email != null) return "u:" + email;
        if (sessionId == null || sessionId.isBlank()) return null;
        String trimmed = sessionId.length() > 64 ? sessionId.substring(0, 64) : sessionId;
        return "s:" + trimmed;
    }

    private String signedInEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        String email = auth.getName();
        return email == null || "anonymousUser".equals(email) ? null : email;
    }
}
