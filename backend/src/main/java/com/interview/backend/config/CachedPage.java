package com.interview.backend.config;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * A {@link PageImpl} that Jackson can serialize AND deserialize, so paginated
 * results can be cached in Redis as human-readable JSON. Spring's plain PageImpl
 * has no JSON constructor, which is why caching it as JSON normally fails.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CachedPage<T> extends PageImpl<T> {

    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public CachedPage(@JsonProperty("content") List<T> content,
                      @JsonProperty("number") int number,
                      @JsonProperty("size") int size,
                      @JsonProperty("totalElements") long totalElements,
                      @JsonProperty("pageable") JsonNode pageable,
                      @JsonProperty("sort") JsonNode sort) {
        super(content, PageRequest.of(number, Math.max(size, 1)), totalElements);
    }

    public CachedPage(List<T> content, Pageable pageable, long total) {
        super(content, pageable, total);
    }

    /** Wrap any Page so it becomes cache/JSON friendly. */
    public static <T> CachedPage<T> of(Page<T> page) {
        return new CachedPage<>(page.getContent(), page.getPageable(), page.getTotalElements());
    }
}
