package com.interview.backend.dto;

// Admin-supplied fields for creating a question. id/number/sortKey are auto-assigned
// server-side when omitted, so the admin only fills the content.
public record QuestionInput(
        String id,
        String tech,
        String title,
        String question,
        String answer,
        String difficulty,
        String category) {
}
