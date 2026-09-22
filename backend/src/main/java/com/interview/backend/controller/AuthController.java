package com.interview.backend.controller;

import com.interview.backend.dto.AuthDtos.*;
import com.interview.backend.entity.User;
import com.interview.backend.repository.UserRepository;
import com.interview.backend.service.EmailService;
import com.interview.backend.service.ProgressService;
import com.interview.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

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

    @Value("${app.admin.emails:}")
    private String adminEmailsCsv;

    private boolean isAdmin(String email) {
        for (String a : adminEmailsCsv.split(",")) {
            if (a.trim().equalsIgnoreCase(email)) return true;
        }
        return false;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req.email() == null || req.password() == null || req.email().isBlank() || req.password().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and a password of at least 6 characters are required"));
        }
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
        }
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setName(req.name());
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(email);
        return ResponseEntity.ok(new AuthResponse(token, email, user.getName(), isAdmin(email)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        String email = req.email() == null ? "" : req.email().trim().toLowerCase();
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, req.password()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
        }
        User user = userRepository.findByEmail(email).orElseThrow();
        String token = jwtUtil.generateToken(email);
        return ResponseEntity.ok(new AuthResponse(token, email, user.getName(), isAdmin(email)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        email = email.trim().toLowerCase();

        User user = userRepository.findByEmail(email).orElse(null);
        // ponytail: always return success even if email not found (security best practice - don't leak account existence)
        if (user == null) {
            return ResponseEntity.ok(Map.of("message", "If that email is registered, a reset link has been sent"));
        }

        String resetToken = UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(Instant.now().plusSeconds(3600)); // 1 hour
        userRepository.save(user);

        emailService.sendPasswordResetEmail(email, resetToken);

        return ResponseEntity.ok(Map.of("message", "If that email is registered, a reset link has been sent"));
    }

    private String getDailyExportCode() {
        String today = java.time.LocalDate.now(java.time.ZoneOffset.UTC).toString();
        // deterministic code for the day
        int codeInt = Math.abs((today + "-interview-export-secret").hashCode()) % 1000000;
        return String.format("%06d", codeInt);
    }

    @PostMapping("/export-code/request")
    public ResponseEntity<?> requestExportCode(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        if (!isAdmin(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        String code = getDailyExportCode();
        emailService.sendExportCodeEmail(email, code);
        return ResponseEntity.ok(Map.of("message", "Export code sent to your email"));
    }

    @PostMapping("/export-code/verify")
    public ResponseEntity<?> verifyExportCode(@RequestBody Map<String, String> req, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String email = jwtUtil.extractEmail(authHeader.substring(7));
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

        User user = userRepository.findAll().stream()
                .filter(u -> token.equals(u.getResetToken()))
                .findFirst()
                .orElse(null);

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
