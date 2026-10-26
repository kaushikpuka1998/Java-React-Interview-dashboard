package com.interview.backend.code;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Supplier;

/**
 * Runs code jobs through a small fixed pool, so Judge0 gets a steady, limited load. Callers submit a job,
 * then poll for its result. Finished results are kept for 10 minutes.
 */
@Service
public class CodeJobs {

    public enum State { QUEUED, RUNNING, DONE }

    /** The HTTP status and body the job's result should be returned with. */
    public record Outcome(int httpStatus, Map<String, Object> body) {}

    public static final class Job {
        private final String id = UUID.randomUUID().toString();
        private final String owner;
        private final Instant created = Instant.now();
        private volatile State state = State.QUEUED;
        private volatile Outcome outcome;
        private volatile Instant finished;

        private Job(String owner) { this.owner = owner; }

        public String id() { return id; }
        public State state() { return state; }
        public Outcome outcome() { return outcome; }
    }

    private static final int MAX_WAITING = 50;

    private final Map<String, Job> jobs = new ConcurrentHashMap<>();
    private final ExecutorService pool;

    public CodeJobs(@Value("${app.code.workers:2}") int workers) {
        this.pool = Executors.newFixedThreadPool(Math.max(1, workers));
    }

    /** Queues a job. Throws IllegalStateException when too many jobs are already waiting. */
    public Job submit(String owner, Supplier<Outcome> task) {
        long waiting = jobs.values().stream().filter(j -> j.state == State.QUEUED).count();
        if (waiting >= MAX_WAITING) throw new IllegalStateException("busy");
        Job job = new Job(owner);
        jobs.put(job.id, job);
        pool.submit(() -> {
            job.state = State.RUNNING;
            try {
                job.outcome = task.get();
            } catch (RuntimeException e) {
                job.outcome = new Outcome(500, Map.of("error", "The run failed. Try again."));
            } finally {
                job.finished = Instant.now();
                job.state = State.DONE;
            }
        });
        return job;
    }

    /** The job if it exists and belongs to this user, otherwise null. */
    public Job find(String id, String owner) {
        Job job = jobs.get(id);
        return job != null && job.owner.equals(owner) ? job : null;
    }

    /** How many jobs are ahead of this one in line (1 means next up). */
    public int position(Job job) {
        return (int) jobs.values().stream()
                .filter(j -> j.state == State.QUEUED && j.created.isBefore(job.created))
                .count() + 1;
    }

    @Scheduled(fixedDelay = 60_000)
    public void cleanup() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(10));
        jobs.values().removeIf(j -> j.state == State.DONE && j.finished != null && j.finished.isBefore(cutoff));
    }
}
