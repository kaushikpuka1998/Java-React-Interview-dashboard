package com.interview.backend.repository;

import com.interview.backend.entity.DigestRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

public interface DigestRunRepository extends JpaRepository<DigestRun, Long> {

    Optional<DigestRun> findByRunDate(LocalDate runDate);

    /** Watermark: where the last completed digest stopped. */
    Optional<DigestRun> findTopByStatusOrderByCoveredToDesc(String status);

    /** Adopt a RUNNING run whose owner stopped heartbeating (crashed). 1 = we own it now. */
    @Modifying
    @Transactional
    @Query("UPDATE DigestRun r SET r.owner = :me, r.heartbeatAt = :now " +
           "WHERE r.id = :id AND r.status = 'RUNNING' AND r.heartbeatAt < :staleBefore")
    int takeOver(@Param("id") Long id, @Param("me") String me,
                 @Param("now") Instant now, @Param("staleBefore") Instant staleBefore);

    /** Still alive. 0 = another instance took the run over; stop sending. */
    @Modifying
    @Transactional
    @Query("UPDATE DigestRun r SET r.heartbeatAt = :now WHERE r.id = :id AND r.owner = :me AND r.status = 'RUNNING'")
    int heartbeat(@Param("id") Long id, @Param("me") String me, @Param("now") Instant now);

    @Modifying
    @Transactional
    @Query("UPDATE DigestRun r SET r.status = 'DONE', r.sentCount = :sent, r.questionCount = :questions, " +
           "r.finishedAt = :now WHERE r.id = :id AND r.owner = :me")
    int finish(@Param("id") Long id, @Param("me") String me, @Param("sent") int sent,
               @Param("questions") int questions, @Param("now") Instant now);
}
