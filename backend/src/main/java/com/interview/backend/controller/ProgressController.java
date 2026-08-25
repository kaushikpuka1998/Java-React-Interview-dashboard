package com.interview.backend.controller;

import com.interview.backend.dto.AuthDtos.ProgressPayload;
import com.interview.backend.entity.User;
import com.interview.backend.entity.UserProgress;
import com.interview.backend.repository.UserProgressRepository;
import com.interview.backend.repository.UserRepository;
import com.interview.backend.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final UserRepository userRepository;
    private final UserProgressRepository progressRepository;
    private final ProgressService progressService;

    private Long currentUserId() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).map(User::getId).orElseThrow();
    }

    @GetMapping
    public ResponseEntity<Map<String, List<String>>> getProgress() {
        List<UserProgress> rows = progressRepository.findByUserId(currentUserId());
        return ResponseEntity.ok(Map.of(
                "visited", rows.stream().filter(UserProgress::isVisited).map(UserProgress::getQuestionId).toList(),
                "read", rows.stream().filter(UserProgress::isRead).map(UserProgress::getQuestionId).toList()));
    }

    @PostMapping("/visited/{questionId}")
    public ResponseEntity<Void> markVisited(@PathVariable String questionId) {
        progressService.markVisited(currentUserId(), questionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read/{questionId}")
    public ResponseEntity<Void> markRead(@PathVariable String questionId) {
        progressService.markRead(currentUserId(), questionId);
        return ResponseEntity.ok().build();
    }

    // Merge guest localStorage progress into the account (called once after login).
    @PostMapping("/merge")
    public ResponseEntity<Void> merge(@RequestBody ProgressPayload payload) {
        progressService.merge(currentUserId(), payload.visited(), payload.read());
        return ResponseEntity.ok().build();
    }
}
