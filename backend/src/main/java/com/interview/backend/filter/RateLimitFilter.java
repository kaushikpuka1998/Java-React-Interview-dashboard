package com.interview.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP fixed-window rate limiter for auth endpoints (brute-force / credential-stuffing defense).
 * ponytail: in-memory + per-instance. Fine for one node; move counters to Redis if you scale to
 * multiple backend instances and need a shared limit.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private final int maxRequests;
    private final long windowMs;
    // key -> [windowStartMillis, count]
    private final ConcurrentHashMap<String, long[]> buckets = new ConcurrentHashMap<>();

    public RateLimitFilter(int maxRequests, long windowSeconds) {
        this.maxRequests = maxRequests;
        this.windowMs = windowSeconds * 1000L;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        // Only limit state-changing auth calls; let preflight and everything else pass.
        // Match on the request URI so it works regardless of context-path handling.
        String uri = request.getRequestURI(); // e.g. /api/auth/login
        boolean limited = "POST".equalsIgnoreCase(request.getMethod())
                && uri != null && uri.contains("/auth/");
        if (!limited) {
            chain.doFilter(request, response);
            return;
        }

        String key = clientIp(request) + "|" + uri;
        long now = System.currentTimeMillis();

        long[] state = buckets.compute(key, (k, v) -> {
            if (v == null || now - v[0] >= windowMs) {
                return new long[]{now, 1}; // new window
            }
            v[1]++; // same window
            return v;
        });

        // Cheap bound on map growth without a scheduler.
        if (buckets.size() > 10_000) buckets.clear();

        if (state[1] > maxRequests) {
            long retryAfter = Math.max(1, (windowMs - (now - state[0])) / 1000);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"Too many requests. Try again in " + retryAfter + "s.\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    // Honor the proxy header (Railway/AWS run behind a load balancer), else the socket address.
    private String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
