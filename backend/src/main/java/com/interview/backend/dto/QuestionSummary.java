package com.interview.backend.dto;

/** A question without its answer: enough for lists, cards and pie charts. Keeps profile responses small. */
public record QuestionSummary(String id, String title, String question, String tech, String difficulty, String category) {}
