package com.interview.backend.service;

import com.interview.backend.entity.DigestRun;
import com.interview.backend.entity.Question;
import com.interview.backend.entity.User;
import com.interview.backend.repository.DigestRunRepository;
import com.interview.backend.repository.QuestionRepository;
import com.interview.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Daily digest of newly published questions — one email per member per day, never two.
 *
 *  - Two instances: only one can insert today's digest_runs row (unique run_date).
 *  - Server down at send time: the check runs every 15 min, so it sends once it's back;
 *    if a whole day is missed, the next run starts at the last DONE watermark and covers both.
 *  - Crash mid-send: the RUNNING row stops heartbeating, gets taken over, and the resumed
 *    run skips members whose lastDigestAt already reached this run's coveredTo.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NewQuestionNotifier {

    static final Duration STALE = Duration.ofMinutes(10);
    private static final int HEARTBEAT_EVERY = 20;

    private final QuestionRepository questions;
    private final UserRepository users;
    private final DigestRunRepository runs;
    private final EmailService email;

    @Value("${app.digest.time:19:00}")
    private LocalTime sendAt;

    @Value("${app.digest.zone:Asia/Kolkata}")
    private ZoneId zone;

    @Scheduled(fixedDelayString = "PT15M", initialDelayString = "PT1M")
    public void tick() {
        ZonedDateTime now = ZonedDateTime.now(zone);
        if (now.toLocalTime().isBefore(sendAt)) return;
        runFor(now.toLocalDate());
    }

    /** Claims (or resumes) the digest for {@code day} and sends it. No-op if done or owned elsewhere. */
    void runFor(LocalDate day) {
        String me = UUID.randomUUID().toString();
        DigestRun run = claim(day, me);
        if (run != null) send(run, me);
    }

    private DigestRun claim(LocalDate day, String me) {
        var existing = runs.findByRunDate(day);
        if (existing.isPresent()) {
            DigestRun r = existing.get();
            if ("DONE".equals(r.getStatus())) return null;
            Instant now = Instant.now();
            if (runs.takeOver(r.getId(), me, now, now.minus(STALE)) == 0) return null;   // still alive elsewhere
            log.warn("Digest {}: previous sender went silent, resuming", day);
            return runs.findById(r.getId()).orElse(null);
        }

        // createdAt is written with the JVM clock, so the window uses the same clock.
        LocalDateTime to = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);
        LocalDateTime from = runs.findTopByStatusOrderByCoveredToDesc("DONE")
                .map(DigestRun::getCoveredTo).orElse(to.minusDays(1));

        DigestRun r = new DigestRun();
        r.setRunDate(day);
        r.setCoveredFrom(from);
        r.setCoveredTo(to);
        r.setStatus("RUNNING");
        r.setOwner(me);
        r.setHeartbeatAt(Instant.now());
        try {
            return runs.saveAndFlush(r);
        } catch (DataIntegrityViolationException e) {
            return null;   // another instance created today's run first
        }
    }

    private void send(DigestRun run, String me) {
        List<Question> fresh = questions.findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByTechAscSortKeyAsc(
                run.getCoveredFrom(), run.getCoveredTo());

        // ponytail: one SMTP send per user, sequential. Fine for hundreds of members;
        // past the provider's daily cap (Gmail ~500) move to a bulk-mail API.
        int sent = 0, i = 0;
        if (!fresh.isEmpty()) {
            for (User u : users.findDigestRecipients(run.getCoveredTo())) {
                if (i++ % HEARTBEAT_EVERY == 0 && runs.heartbeat(run.getId(), me, Instant.now()) == 0) {
                    log.warn("Digest {}: taken over by another instance, stopping", run.getRunDate());
                    return;
                }
                try {
                    email.sendNewQuestionsEmail(u.getEmail(), u.getName(), fresh);
                    users.markDigested(u.getId(), run.getCoveredTo());
                    sent++;
                } catch (Exception e) {
                    // ponytail: a failed member is not retried; they miss this digest. Add a retry pass if bounces matter.
                    log.warn("Digest email to {} failed: {}", u.getEmail(), e.toString());
                }
            }
        }
        runs.finish(run.getId(), me, sent, fresh.size(), Instant.now());
        log.info("Digest {}: {} question(s), {} email(s) sent", run.getRunDate(), fresh.size(), sent);
    }
}
