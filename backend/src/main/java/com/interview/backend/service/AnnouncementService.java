package com.interview.backend.service;

import com.interview.backend.entity.EmailLog;
import com.interview.backend.entity.User;
import com.interview.backend.repository.EmailLogRepository;
import com.interview.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

/** Admin-composed emails. The send runs in the background; every attempt is logged. */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementService {

    public static final String ALL = "all";
    public static final String NO_LOCATION = "no-location";

    private final UserRepository users;
    private final EmailService email;
    private final EmailLogRepository emailLogs;

    public List<User> audience(String audience) {
        return NO_LOCATION.equals(audience) ? users.findSubscribedWithoutLocation() : users.findSubscribed();
    }

    // ponytail: one SMTP send per member, sequential. Fine for hundreds; past the provider cap move to a bulk-mail API.
    @Async
    public void send(String subject, String body, String audience) {
        List<User> recipients = audience(audience);
        int sent = 0;
        for (User u : recipients) {
            try {
                email.sendAnnouncement(u.getEmail(), subject, body);
                sent++;
                emailLogs.save(EmailLog.of(u, "ANNOUNCEMENT", subject, null));
            } catch (Exception e) {
                log.warn("Announcement to {} failed: {}", u.getEmail(), e.toString());
                emailLogs.save(EmailLog.of(u, "ANNOUNCEMENT", subject, e));
            }
        }
        log.info("Announcement '{}': {}/{} sent", subject, sent, recipients.size());
    }
}
