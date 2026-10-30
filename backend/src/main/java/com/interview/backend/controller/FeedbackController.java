package com.interview.backend.controller;

import com.interview.backend.entity.Feedback;
import com.interview.backend.repository.FeedbackRepository;
import com.interview.backend.service.ImageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Feedback from the home page form, with optional screenshots. Sending is open to everyone; reading is admin-only (/admin/**). */
@RestController
public class FeedbackController {

    public record FeedbackInput(Integer rating, String message, String email, List<String> imageUrls, String page) {}

    private static final int MAX_IMAGES = 3;
    // SVG is left out on purpose: anonymous visitors can upload here, and an SVG can carry scripts.
    private static final Set<String> IMAGE_TYPES = Set.of("image/png", "image/jpeg", "image/gif", "image/webp");

    private final FeedbackRepository feedback;
    private final ImageService images;

    public FeedbackController(FeedbackRepository feedback, ImageService images) {
        this.feedback = feedback;
        this.images = images;
    }

    /** A screenshot for a feedback message. Returns { "url": "..." }. */
    @PostMapping(value = "/feedback/image", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
        if (file.getContentType() == null || !IMAGE_TYPES.contains(file.getContentType()))
            return ResponseEntity.badRequest().body(Map.of("error", "Please attach a PNG, JPG, GIF or WebP image."));
        try {
            return ResponseEntity.ok(Map.of("url", images.upload(file)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed"));
        }
    }

    @PostMapping("/feedback")
    public ResponseEntity<?> send(@RequestBody FeedbackInput in, Principal principal) {
        String message = in.message() == null ? "" : in.message().trim();
        if (message.length() < 5) return ResponseEntity.badRequest().body(Map.of("error", "Please write a few words of feedback."));
        if (message.length() > 2000) return ResponseEntity.badRequest().body(Map.of("error", "Feedback is too long (max 2000 characters)."));
        if (in.rating() != null && (in.rating() < 1 || in.rating() > 5)) return ResponseEntity.badRequest().body(Map.of("error", "Rating must be 1 to 5."));
        List<String> urls = new ArrayList<>();
        if (in.imageUrls() != null) {
            for (String u : in.imageUrls()) {
                if (u == null || u.length() > 400 || !u.contains("/api/images/file/images/") || u.contains(" ") || u.contains("\n"))
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid screenshot."));
                urls.add(u);
            }
            if (urls.size() > MAX_IMAGES) return ResponseEntity.badRequest().body(Map.of("error", "Attach at most " + MAX_IMAGES + " screenshots."));
        }
        Feedback f = new Feedback();
        f.setMessage(message);
        f.setRating(in.rating());
        // A signed-in sender is identified by their account; the email is never taken from the request.
        // A signed-out sender must give an email so the team can reply.
        if (principal != null && principal.getName() != null) {
            f.setEmail(principal.getName());
            f.setFromAccount(true);
        } else {
            String email = in.email() == null ? "" : in.email().trim();
            if (email.isEmpty() || email.length() > 200 || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"))
                return ResponseEntity.badRequest().body(Map.of("error", "Please enter a valid email so we can reply."));
            f.setEmail(email);
        }
        f.setImageUrls(urls.isEmpty() ? null : String.join("\n", urls));
        String page = in.page() == null ? "" : in.page().trim();
        f.setPage(page.isEmpty() ? null : page.substring(0, Math.min(300, page.length())));
        feedback.save(f);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/admin/feedback")
    public List<Map<String, Object>> list() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Feedback f : feedback.findAllByOrderByCreatedAtDesc()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", f.getId());
            row.put("rating", f.getRating());
            row.put("message", f.getMessage());
            row.put("email", f.getEmail());
            row.put("fromAccount", Boolean.TRUE.equals(f.getFromAccount()));
            row.put("page", f.getPage());
            row.put("imageUrls", f.getImageUrls() == null ? List.of() : List.of(f.getImageUrls().split("\n")));
            row.put("createdAt", f.getCreatedAt());
            out.add(row);
        }
        return out;
    }

    @DeleteMapping("/admin/feedback/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!feedback.existsById(id)) return ResponseEntity.notFound().build();
        feedback.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
