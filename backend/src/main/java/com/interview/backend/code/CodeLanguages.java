package com.interview.backend.code;

import java.util.List;
import java.util.Optional;

/**
 * Languages the code runner accepts. Each id is a Judge0 language id. The ids below are Judge0 CE
 * defaults; check them against GET /languages on your Judge0 server before going live.
 */
public final class CodeLanguages {

    /**
     * memoryKb and cpuSeconds are per-run limits. Because we ask Judge0 for per-process limits (see
     * CodeRunner), memoryKb becomes an address-space cap, not a resident-memory one. Runtimes that
     * reserve large virtual ranges up front need far more than they ever use: the JVM reserves a 1 GB
     * compressed class space, and V8 reserves a big code range, so Java and JavaScript get GB-scale
     * caps while actually running in ~40 MB. Measured against Judge0 1.13.1; lower values fail at
     * startup, before the submitted code runs. Java also needs MAX_MEMORY_LIMIT >= 4096000 in
     * judge0.conf on the Judge0 host, which otherwise rejects the submission outright.
     */
    public record Language(String key, String label, int judge0Id, int memoryKb, int cpuSeconds) {}

    public static final List<Language> ALL = List.of(
            new Language("java", "Java", 62, 4_096_000, 10),
            new Language("cpp", "C++", 54, 256_000, 5),
            new Language("c", "C", 50, 256_000, 5),
            new Language("python", "Python", 71, 256_000, 5),
            new Language("javascript", "JavaScript", 63, 1_024_000, 5),
            new Language("go", "Go", 60, 256_000, 5),
            new Language("ruby", "Ruby", 72, 256_000, 5),
            new Language("rust", "Rust", 73, 256_000, 5),
            new Language("csharp", "C#", 51, 256_000, 5),
            new Language("php", "PHP", 68, 256_000, 5),
            new Language("swift", "Swift", 83, 256_000, 5));

    public static Optional<Language> find(String key) {
        return ALL.stream().filter(l -> l.key().equals(key)).findFirst();
    }

    private CodeLanguages() {}
}
