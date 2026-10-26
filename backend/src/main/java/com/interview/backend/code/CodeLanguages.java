package com.interview.backend.code;

import java.util.List;
import java.util.Optional;

/**
 * Languages the code runner accepts. Each id is a Judge0 language id. The ids below are Judge0 CE
 * defaults; check them against GET /languages on your Judge0 server before going live.
 */
public final class CodeLanguages {

    /** memoryKb and cpuSeconds are per-run limits. The JVM and Node start slower, so they get more CPU time. */
    public record Language(String key, String label, int judge0Id, int memoryKb, int cpuSeconds) {}

    public static final List<Language> ALL = List.of(
            new Language("cpp", "C++", 54, 256_000, 5),
            new Language("c", "C", 50, 256_000, 5),
            new Language("python", "Python", 71, 256_000, 5),
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
