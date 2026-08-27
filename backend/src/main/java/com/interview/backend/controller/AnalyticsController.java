package com.interview.backend.controller;

import com.interview.backend.entity.PageView;
import com.interview.backend.entity.Question;
import com.interview.backend.entity.User;
import com.interview.backend.repository.PageViewRepository;
import com.interview.backend.repository.QuestionRepository;
import com.interview.backend.repository.UserProgressRepository;
import com.interview.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final PageViewRepository pageViews;
    private final UserRepository users;
    private final QuestionRepository questions;
    private final UserProgressRepository progress;

    // ---------- public: record an event ----------

    public record TrackRequest(String path, String questionId, String referrer,
                               String sessionId, String device) {}

    /**
     * Fire-and-forget event recording. Public, because anonymous visitors are
     * exactly what we want to measure. Never returns an error to the client —
     * analytics must not break the page.
     */
    @PostMapping("/track")
    public ResponseEntity<Void> track(@RequestBody TrackRequest req, HttpServletRequest http) {
        try {
            PageView pv = new PageView();
            pv.setPath(trim(req.path(), 512));
            pv.setQuestionId(trim(req.questionId(), 100));
            pv.setReferrer(trim(req.referrer(), 512));
            pv.setReferrerHost(referrerHost(req.referrer(), http));
            pv.setSessionId(trim(req.sessionId(), 64));
            pv.setDevice(trim(req.device(), 20));
            pv.setUserId(currentUserId());   // resolved from the JWT, never client-supplied
            pageViews.save(pv);
        } catch (Exception ignored) {
            // swallow: a failed metric must never surface to the visitor
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * The signed-in user, if the request carried a valid token. Anonymous visitors
     * return null. Taken from the security context rather than the request body so a
     * client cannot attribute views to someone else.
     */
    private Long currentUserId() {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;
            String email = auth.getName();
            if (email == null || "anonymousUser".equals(email)) return null;
            return users.findByEmail(email).map(User::getId).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    /** Group traffic by source host; anything from our own origin counts as internal. */
    private String referrerHost(String referrer, HttpServletRequest http) {
        if (referrer == null || referrer.isBlank()) return "direct";
        try {
            String host = URI.create(referrer).getHost();
            if (host == null || host.isBlank()) return "direct";
            String self = http.getServerName();
            if (host.equalsIgnoreCase(self)) return "internal";
            return host.replaceFirst("^www\\.", "").toLowerCase();
        } catch (Exception e) {
            return "unknown";
        }
    }

    private static String trim(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }

    // ---------- admin: dashboard ----------

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary(@RequestParam(defaultValue = "30") int days) {
        int window = Math.min(Math.max(days, 1), 365);
        Instant since = Instant.now().minus(window, ChronoUnit.DAYS);
        Instant dayAgo = Instant.now().minus(1, ChronoUnit.DAYS);
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("windowDays", window);

        // Traffic
        Map<String, Object> traffic = new LinkedHashMap<>();
        traffic.put("totalViews", pageViews.count());
        traffic.put("viewsInWindow", pageViews.countByCreatedAtAfter(since));
        traffic.put("viewsToday", pageViews.countByCreatedAtAfter(dayAgo));
        traffic.put("uniqueVisitors", pageViews.countUniqueVisitors());
        traffic.put("uniqueInWindow", pageViews.countUniqueVisitorsSince(since));
        out.put("traffic", traffic);

        // Who those visitors were: new vs returning, signed-in vs anonymous.
        long unique = pageViews.countUniqueVisitorsSince(since);
        long newVisitors = Math.min(pageViews.countNewVisitorsSince(since), unique);
        long viewsWindow = pageViews.countByCreatedAtAfter(since);
        long signedInViews = pageViews.countSignedInViewsSince(since);

        Map<String, Object> audience = new LinkedHashMap<>();
        audience.put("unique", unique);
        audience.put("newVisitors", newVisitors);
        audience.put("returningVisitors", Math.max(0, unique - newVisitors));
        audience.put("engagedVisitors", pageViews.countEngagedVisitorsSince(since));
        audience.put("identifiedUsers", pageViews.countIdentifiedUsersSince(since));
        audience.put("signedInViews", signedInViews);
        audience.put("anonymousViews", Math.max(0, viewsWindow - signedInViews));
        audience.put("registeredMembers", users.count());
        audience.put("viewsPerVisitor", unique > 0 ? Math.round((viewsWindow * 10.0) / unique) / 10.0 : 0);
        out.put("audience", audience);

        // Where visitors come from
        out.put("referrers", pageViews.topReferrers(since, PageRequest.of(0, 10)).stream()
                .map(r -> Map.of("source", r[0] == null ? "direct" : r[0],
                                 "views", ((Number) r[1]).longValue(),
                                 "visitors", ((Number) r[2]).longValue()))
                .collect(Collectors.toList()));

        // Most-opened questions, resolved to their titles
        List<Object[]> top = pageViews.topQuestions(since, PageRequest.of(0, 10));
        List<String> ids = top.stream().map(r -> (String) r[0]).toList();
        Map<String, Question> byId = questions.findAllById(ids).stream()
                .collect(Collectors.toMap(Question::getId, q -> q, (a, b) -> a));
        out.put("topQuestions", top.stream().map(r -> {
            Question q = byId.get((String) r[0]);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r[0]);
            m.put("title", q != null ? q.getTitle() : "(deleted)");
            m.put("tech", q != null ? q.getTech() : null);
            m.put("views", ((Number) r[1]).longValue());
            return m;
        }).collect(Collectors.toList()));

        out.put("devices", pageViews.deviceBreakdown(since).stream()
                .map(r -> Map.of("device", r[0] == null ? "unknown" : r[0],
                                 "views", ((Number) r[1]).longValue()))
                .collect(Collectors.toList()));

        out.put("daily", pageViews.dailySeries(since).stream()
                .map(r -> Map.of("date", String.valueOf(r[0]),
                                 "views", ((Number) r[1]).longValue(),
                                 "visitors", ((Number) r[2]).longValue()))
                .collect(Collectors.toList()));

        // Signups — the "any new joiners?" panel
        Map<String, Object> signups = new LinkedHashMap<>();
        signups.put("total", users.count());
        signups.put("today", users.countByCreatedAtAfter(dayAgo));
        signups.put("thisWeek", users.countByCreatedAtAfter(weekAgo));
        signups.put("inWindow", users.countByCreatedAtAfter(since));
        out.put("signups", signups);

        out.put("content", Map.of(
                "totalQuestions", questions.count(),
                "totalProgressRows", progress.count()));

        return ResponseEntity.ok(out);
    }

    /** Recent signups feed. `since` is an ISO instant so the UI can badge new ones. */
    @GetMapping("/signups")
    public ResponseEntity<Map<String, Object>> signups(
            @RequestParam(required = false) String since,
            @RequestParam(defaultValue = "20") int limit) {

        int n = Math.min(Math.max(limit, 1), 100);
        List<User> recent = users.findAllByOrderByCreatedAtDesc(PageRequest.of(0, n));

        long newCount = 0;
        if (since != null && !since.isBlank()) {
            try {
                newCount = users.countByCreatedAtAfter(Instant.parse(since));
            } catch (Exception ignored) { /* bad cursor: report 0 rather than failing */ }
        }

        return ResponseEntity.ok(Map.of(
                "newSince", newCount,
                "users", recent.stream().map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("email", u.getEmail());
                    m.put("name", u.getName() == null ? "" : u.getName());
                    m.put("joinedAt", u.getCreatedAt());
                    return m;
                }).collect(Collectors.toList())));
    }
}
