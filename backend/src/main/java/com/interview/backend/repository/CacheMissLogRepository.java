package com.interview.backend.repository;

import com.interview.backend.entity.CacheMissLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CacheMissLogRepository extends JpaRepository<CacheMissLog, Long> {
}
