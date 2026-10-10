package com.interview.backend.controller;

import com.interview.backend.dto.AuthDtos.*;
import com.interview.backend.entity.User;
import com.interview.backend.repository.UserRepository;
import com.interview.backend.service.EmailService;
import com.interview.backend.service.ProgressService;
import com.interview.backend.util.JwtUtil;
import com.interview.backend.util.CookieUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.interview.backend.filter.RateLimitFilter;
import com.interview.backend.service.GeoService;
import com.interview.backend.service.LocationRules;

import java.security.Principal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final ProgressService progressService;
    private final EmailService emailService;
    private final CookieUtil cookieUtil;
    private final GeoService geo;

    @Value("${app.admin.emails:}")
    private String adminEmailsCsv;

    private boolean isAdmin(String email) {
        for (String a : adminEmailsCsv.split(",")) {
            if (a.trim().equalsIgnoreCase(email)) return true;
        }
        return false;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req, HttpServletRequest http, HttpServletResponse response) {
        if (req.email() == null || req.password() == null || req.email().isBlank() || req.password().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and a password of at least 6 characters are required"));
        }
        LocationRules.Location loc;
        try {
            loc = LocationRules.validate(req.country(), req.city());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
        }
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setName(req.name());
        user.setLastLoginAt(Instant.now());
        GeoService.applyUserLocation(user, loc.country(), loc.city());
        user = userRepository.save(user);
        geo.resolveFromIp(user.getId(), RateLimitFilter.clientIp(http));

        String token = jwtUtil.generateToken(email);
        cookieUtil.setTokenCookie(response, token);
        return ResponseEntity.ok(new AuthResponse(token, email, user.getName(), isAdmin(email)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpServletRequest http, HttpServletResponse response) {
        String email = req.email() == null ? "" : req.email().trim().toLowerCase();
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, req.password()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
        }
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        geo.resolveFromIp(user.getId(), RateLimitFilter.clientIp(http));
        String token = jwtUtil.generateToken(email);
        cookieUtil.setTokenCookie(response, token);
        return ResponseEntity.ok(new AuthResponse(token, email, user.getName(), isAdmin(email)));
    }

    /** One-click unsubscribe from new-question emails. Public: the HMAC signature is the auth. */
    @GetMapping(value = "/unsubscribe", produces = "text/plain")
    public ResponseEntity<String> unsubscribe(@RequestParam String email, @RequestParam String sig) {
        if (!emailService.isValidUnsubscribe(email, sig))
            return ResponseEntity.badRequest().body("Invalid unsubscribe link.");
        userRepository.findByEmail(email).ifPresent(u -> {
            u.setEmailOptOut(true);
            userRepository.save(u);
        });
        return ResponseEntity.ok("You've been unsubscribed from new-question emails.");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        cookieUtil.clearTokenCookie(response);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        email = email.trim().toLowerCase();

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(Map.of("message", "If that email is registered, a reset link has been sent"));
        }

        String resetToken = UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(Instant.now().plusSeconds(3600)); // 1 hour
        userRepository.save(user);

        try {
            emailService.sendPasswordResetEmail(email, resetToken);
        } catch (MailException e) {
            // SMTP down/misconfigured — say so instead of an opaque 500, and keep the cause in the logs.
            log.error("Password reset email to {} failed: {}", email, e.toString());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "We couldn't send the reset email right now. Please try again later."));
        }

        return ResponseEntity.ok(Map.of("message", "If that email is registered, a reset link has been sent"));
    }

    private String getDailyExportCode() {
        String today = java.time.LocalDate.now(java.time.ZoneOffset.UTC).toString();
        int codeInt = Math.abs((today + "-interview-export-secret").hashCode()) % 1000000;
        return String.format("%06d", codeInt);
    }

    @PostMapping("/export-code/request")
    public ResponseEntity<?> requestExportCode(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String email = principal.getName();
        if (!isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        String code = getDailyExportCode();
        emailService.sendExportCodeEmail(email, code);
        return ResponseEntity.ok(Map.of("message", "Export code sent to your email"));
    }

    @PostMapping("/export-code/verify")
    public ResponseEntity<?> verifyExportCode(@RequestBody Map<String, String> req, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String email = principal.getName();
        if (!isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        String provided = req.get("code");
        String expected = getDailyExportCode();
        if (expected.equals(provided)) {
            return ResponseEntity.ok(Map.of("valid", true));
        } else {
            return ResponseEntity.ok(Map.of("valid", false));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> req) {
        String token = req.get("token");
        String newPassword = req.get("password");

        if (token == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Valid token and password (min 6 chars) required"));
        }

        User user = userRepository.findByResetToken(token).orElse(null);

        if (user == null || user.getResetTokenExpiry() == null || Instant.now().isAfter(user.getResetTokenExpiry())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired reset token"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }
}
