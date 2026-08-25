package com.interview.backend.dto;

import java.util.List;

// Request/response payloads for auth + progress.
public class AuthDtos {

    public record RegisterRequest(String email, String password, String name) {}

    public record LoginRequest(String email, String password) {}

    public record AuthResponse(String token, String email, String name, boolean admin) {}

    // Guest progress optionally merged on login/register.
    public record ProgressPayload(List<String> visited, List<String> read) {}
}
