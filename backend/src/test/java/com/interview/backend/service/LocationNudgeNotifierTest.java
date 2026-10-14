package com.interview.backend.service;

import com.interview.backend.entity.User;
import com.interview.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class LocationNudgeNotifierTest {

    @Test
    void nudgesEachMemberOnceEvenIfTheRunRepeats() throws Exception {
        UserRepository users = mock(UserRepository.class);
        EmailService email = mock(EmailService.class);
        User u = new User();
        u.setId(7L);
        u.setEmail("nudge@example.com");
        when(users.findNeedingLocationNudge(any())).thenReturn(List.of(u));
        // First claim wins; the repeat run finds the row already claimed.
        when(users.claimLocationNudge(eq(7L), any(), any())).thenReturn(1, 0);

        LocationNudgeNotifier notifier = new LocationNudgeNotifier(users, email, mock(com.interview.backend.repository.EmailLogRepository.class));
        notifier.sendNudges(Instant.now());
        notifier.sendNudges(Instant.now());

        verify(email, times(1)).sendLocationNudgeEmail(eq("nudge@example.com"), any());
    }
}
