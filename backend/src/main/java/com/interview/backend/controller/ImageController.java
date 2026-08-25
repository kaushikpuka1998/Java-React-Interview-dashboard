package com.interview.backend.controller;

import com.interview.backend.service.ImageService;
import com.interview.backend.service.ImageService.StoredImage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    // Admin-only (locked in SecurityConfig). Returns { "url": "..." }.
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
        }
        try {
            return ResponseEntity.ok(Map.of("url", imageService.upload(file)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    // Public streaming proxy: the bucket stays private, images are served from here.
    // {*key} captures the full object key including slashes (e.g. images/<uuid>.jpg).
    @GetMapping("/file/{*key}")
    public ResponseEntity<byte[]> view(@PathVariable String key) {
        String objectKey = key.startsWith("/") ? key.substring(1) : key;
        try {
            StoredImage img = imageService.fetch(objectKey);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(img.contentType()))
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic())
                    .body(img.bytes());
        } catch (NoSuchKeyException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
