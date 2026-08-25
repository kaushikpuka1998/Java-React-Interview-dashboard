package com.interview.backend.controller;

import com.interview.backend.dto.AuthDtos.*;
import com.interview.backend.entity.User;
import com.interview.backend.repository.UserRepository;
import com.interview.backend.service.ProgressService;
import com.interview.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final ProgressService progressService;

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
        return ResponseEntity.ok(new AuthResponse(token, email, user.getName()));
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
        return ResponseEntity.ok(new AuthResponse(token, email, user.getName()));
    }
}
