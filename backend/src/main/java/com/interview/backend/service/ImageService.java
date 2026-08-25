package com.interview.backend.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class ImageService {

    private static final Set<String> ALLOWED = Set.of(
            "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml");
    private static final long MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    private final S3Client s3;
    private final String bucket;
    private final String publicUrl;

    public ImageService(S3Client s3,
                        @Value("${app.s3.bucket}") String bucket,
                        @Value("${app.s3.public-url}") String publicUrl) {
        this.s3 = s3;
        this.bucket = bucket;
        this.publicUrl = publicUrl.replaceAll("/+$", "");
    }

    // Ensure the bucket exists (LocalStack starts empty). Also make objects publicly readable.
    @PostConstruct
    void ensureBucket() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (S3Exception e) { // covers NoSuchBucketException (a subclass) and 404s
            try {
                s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
                log.info("Created S3 bucket '{}'", bucket);
            } catch (BucketAlreadyOwnedByYouException | BucketAlreadyExistsException ignored) {
            } catch (Exception ex) {
                log.warn("Could not create bucket '{}': {}", bucket, ex.getMessage());
            }
        }
    }

    // Uploads the image and returns its public URL.
    public String upload(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED.contains(contentType)) {
            throw new IllegalArgumentException("Unsupported image type: " + contentType);
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Image exceeds 5 MB limit");
        }

        String ext = switch (contentType) {
            case "image/png" -> ".png";
            case "image/jpeg" -> ".jpg";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            case "image/svg+xml" -> ".svg";
            default -> "";
        };
        String key = "images/" + UUID.randomUUID() + ext;

        s3.putObject(PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .acl(ObjectCannedACL.PUBLIC_READ)
                        .build(),
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        // Path-style public URL, e.g. http://localhost:4566/blog-images/images/<uuid>.png
        return publicUrl + "/" + bucket + "/" + key;
    }
}
