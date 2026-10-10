package com.interview.backend.service;

import com.interview.backend.entity.DigestRun;
import com.interview.backend.entity.Question;
import com.interview.backend.entity.User;
import com.interview.backend.repository.DigestRunRepository;
import com.interview.backend.repository.QuestionRepository;
import com.interview.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Every duplicate/missed-digest scenario, against a real (H2) database with commits between steps. */
@DataJpaTest
@Import(NewQuestionNotifier.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@TestPropertySource(properties = "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect")
class NewQuestionNotifierTest {

    @Autowired NewQuestionNotifier notifier;
    @Autowired DigestRunRepository runs;
    @Autowired QuestionRepository questions;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    @MockBean EmailService email;

    static final LocalDate TODAY = LocalDate.of(2026, 10, 10);
    User alice, bob;

    @BeforeEach
    void reset() {
        runs.deleteAll(); questions.deleteAll(); users.deleteAll();
        alice = user("alice@x.com");
        bob = user("bob@x.com");
    }

    @Test
    void sendsOneDigestPerDayEvenWhenTwoInstancesRunTogether() {
        question("java-1", LocalDateTime.now().minusHours(2));
        question("java-2", LocalDateTime.now().minusHours(1));

        CompletableFuture.allOf(
                CompletableFuture.runAsync(() -> notifier.runFor(TODAY)),
                CompletableFuture.runAsync(() -> notifier.runFor(TODAY))).join();
        notifier.runFor(TODAY);   // later 15-min tick, same day

        verify(email, times(1)).sendNewQuestionsEmail(eq("alice@x.com"), any(), argThat(l -> l.size() == 2));
        verify(email, times(1)).sendNewQuestionsEmail(eq("bob@x.com"), any(), anyList());
        assertThat(runs.findAll()).singleElement().extracting(DigestRun::getStatus).isEqualTo("DONE");
    }

    @Test
    void quietDaySendsNothing() {
        notifier.runFor(TODAY);
        verifyNoInteractions(email);
        assertThat(runs.findByRunDate(TODAY)).get().extracting(DigestRun::getStatus).isEqualTo("DONE");
    }

    @Test
    void missedDayRollsIntoTheNextDigest() {
        LocalDateTime now = LocalDateTime.now();
        doneRun(TODAY.minusDays(2), now.minusDays(2));                  // last digest: 2 days ago
        question("missed-day", now.minusDays(1).minusHours(3));        // added while server was down
        question("today", now.minusHours(1));

        notifier.runFor(TODAY);

        verify(email).sendNewQuestionsEmail(eq("alice@x.com"), any(), argThat(l -> l.size() == 2));
    }

    @Test
    void crashedRunResumesWithoutResendingToAnyoneAlreadyEmailed() {
        LocalDateTime to = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);
        question("java-1", to.minusHours(1));
        DigestRun crashed = run(TODAY, to.minusDays(1), to, "RUNNING", Instant.now().minus(NewQuestionNotifier.STALE).minusSeconds(60));
        users.markDigested(alice.getId(), to);                         // alice got it before the crash

        notifier.runFor(TODAY);

        verify(email, never()).sendNewQuestionsEmail(eq("alice@x.com"), any(), anyList());
        verify(email, times(1)).sendNewQuestionsEmail(eq("bob@x.com"), any(), anyList());
        assertThat(runs.findById(crashed.getId())).get().extracting(DigestRun::getStatus).isEqualTo("DONE");
    }

    @Test
    void liveRunOnAnotherInstanceIsLeftAlone() {
        LocalDateTime to = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);
        question("java-1", to.minusHours(1));
        run(TODAY, to.minusDays(1), to, "RUNNING", Instant.now());     // fresh heartbeat

        notifier.runFor(TODAY);

        verifyNoInteractions(email);
    }

    @Test
    void optedOutMembersNeverGetIt() {
        bob.setEmailOptOut(true);
        users.save(bob);
        question("java-1", LocalDateTime.now().minusHours(1));

        notifier.runFor(TODAY);

        verify(email).sendNewQuestionsEmail(eq("alice@x.com"), any(), anyList());
        verify(email, never()).sendNewQuestionsEmail(eq("bob@x.com"), any(), anyList());
    }

    // ---------- fixtures ----------

    private User user(String mail) {
        User u = new User();
        u.setEmail(mail);
        u.setPassword("x");
        return users.save(u);
    }

    private void question(String id, LocalDateTime createdAt) {
        questions.saveAndFlush(Question.builder().id(id).number(1).displayNumber(1).sortKey(1)
                .title(id).question(id).answer("a").tech("java").build());
        // @CreationTimestamp always stamps "now"; backdate it directly.
        jdbc.update("UPDATE questions SET created_at = ? WHERE id = ?", createdAt, id);
    }

    private void doneRun(LocalDate day, LocalDateTime coveredTo) {
        run(day, coveredTo.minusDays(1), coveredTo, "DONE", Instant.now());
    }

    private DigestRun run(LocalDate day, LocalDateTime from, LocalDateTime to, String status, Instant heartbeat) {
        DigestRun r = new DigestRun();
        r.setRunDate(day);
        r.setCoveredFrom(from);
        r.setCoveredTo(to);
        r.setStatus(status);
        r.setOwner("other-instance");
        r.setHeartbeatAt(heartbeat);
        return runs.save(r);
    }
}
