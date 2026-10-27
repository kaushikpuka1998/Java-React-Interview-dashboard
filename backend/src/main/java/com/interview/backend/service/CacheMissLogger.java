package com.interview.backend.service;

import com.interview.backend.entity.CacheMissLog;
import com.interview.backend.repository.CacheMissLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/** Writes a cache_miss_logs row off the request thread. Only called from inside @Cacheable bodies. */
@Service
@RequiredArgsConstructor
@Slf4j
public class CacheMissLogger {

    private final CacheMissLogRepository repository;

    @Async
    public void record(String cacheName, Object key) {
        try {
            repository.save(new CacheMissLog(cacheName, String.valueOf(key)));
        } catch (RuntimeException e) {
            log.warn("Could not log cache miss {}: {}", cacheName, e.getMessage());
        }
    }
}
