package com.interview.backend.service;

import com.interview.backend.entity.EmailLog;
import com.interview.backend.entity.User;
import com.interview.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Once a week (Monday 10:00 by default) emails members who haven't added a country and city,
 * since they can't appear on the leaderboard without one. Each member gets at most one nudge a week:
 * the claim happens before the send, so a second instance or a retry can't send it again.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LocationNudgeNotifier {

    private final UserRepository users;
    private final EmailService email;
    private final com.interview.backend.repository.EmailLogRepository emailLogs;

    @Value("${app.digest.zone:Asia/Kolkata}")
    private ZoneId zone;

    @Scheduled(fixedDelayString = "PT1H", initialDelayString = "PT2M")
    public void tick() {
        ZonedDateTime now = ZonedDateTime.now(zone);
        if (now.getDayOfWeek() != DayOfWeek.MONDAY || now.getHour() != 10) return;
        sendNudges(Instant.now());
    }

    void sendNudges(Instant now) {
        Instant weekAgo = now.minus(6, ChronoUnit.DAYS);
        int sent = 0;
        for (User u : users.findNeedingLocationNudge(weekAgo)) {
            if (users.claimLocationNudge(u.getId(), now, weekAgo) == 0) continue;
            try {
                email.sendLocationNudgeEmail(u.getEmail(), u.getName());
                sent++;
                emailLogs.save(EmailLog.of(u, "NUDGE", "Add your location to join the weekly leaderboard", null));
            } catch (Exception e) {
                log.warn("Location nudge to {} failed: {}", u.getEmail(), e.toString());
                emailLogs.save(EmailLog.of(u, "NUDGE", "Add your location to join the weekly leaderboard", e));
            }
        }
        log.info("Location nudge: {} email(s) sent", sent);
    }
}
