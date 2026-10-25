package com.interview.backend.resume;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/**
 * Compiles LaTeX to PDF with Tectonic (free, open source). Runs in a fresh temp folder, one
 * compile at a time per server slot, with a timeout. Shell escape and file access are blocked.
 */
@Slf4j
@Component
public class TexCompiler {

    public static class CompileException extends Exception {
        private final String log;
        public CompileException(String message, String log) { super(message); this.log = log; }
        public String log() { return log; }
    }

    /** Commands that read or write files or run programs. The template's glyphtounicode include is allowed by name. */
    private static final Pattern FORBIDDEN = Pattern.compile(
            "\\\\(write18|write|immediate|openin|openout|read|input|include|includeonly|catcode)\\b");
    private static final String ALLOWED_INCLUDE = "\\input{glyphtounicode}";

    public static final int MAX_CHARS = 200_000;

    private final String tectonicPath;
    private final Semaphore slots = new Semaphore(2);

    public TexCompiler(@Value("${app.tectonic.path:tectonic}") String tectonicPath) {
        this.tectonicPath = tectonicPath;
    }

    /** Returns the PDF bytes, or throws CompileException carrying the LaTeX log for the user. */
    public byte[] compile(String latex) throws CompileException {
        if (latex == null || latex.isBlank()) throw new CompileException("The LaTeX is empty", "");
        if (latex.length() > MAX_CHARS) throw new CompileException("The LaTeX is too large", "");
        if (FORBIDDEN.matcher(latex.replace(ALLOWED_INCLUDE, "")).find()) {
            throw new CompileException("This LaTeX uses a command that isn't allowed here (file access or shell commands).", "");
        }
        if (!slots.tryAcquire()) throw new CompileException("The compiler is busy. Try again in a moment.", "");
        Path dir = null;
        try {
            dir = Files.createTempDirectory("resume-");
            Files.writeString(dir.resolve("resume.tex"), latex, StandardCharsets.UTF_8);
            Process p = new ProcessBuilder(List.of(tectonicPath, "-X", "compile", "--outdir", dir.toString(), "resume.tex"))
                    .directory(dir.toFile())
                    .redirectErrorStream(true)
                    .start();
            byte[] out = p.getInputStream().readAllBytes();
            if (!p.waitFor(120, TimeUnit.SECONDS)) {
                p.destroyForcibly();
                throw new CompileException("Compiling took too long (over 2 minutes).", "");
            }
            String log = tail(new String(out, StandardCharsets.UTF_8));
            Path pdf = dir.resolve("resume.pdf");
            if (p.exitValue() != 0 || !Files.exists(pdf)) {
                throw new CompileException("LaTeX error. Fix the line shown in the log and compile again.", log);
            }
            return Files.readAllBytes(pdf);
        } catch (IOException e) {
            log.warn("Tectonic could not run: {}", e.toString());
            throw new CompileException("The PDF compiler is not installed on this server.", e.toString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CompileException("Compiling was interrupted.", "");
        } finally {
            slots.release();
            if (dir != null) deleteQuietly(dir);
        }
    }

    private static String tail(String s) {
        return s.length() > 4000 ? s.substring(s.length() - 4000) : s;
    }

    private static void deleteQuietly(Path dir) {
        try (var files = Files.walk(dir)) {
            files.sorted(java.util.Comparator.reverseOrder()).forEach(p -> p.toFile().delete());
        } catch (IOException ignored) { /* temp folder cleanup is best effort */ }
    }
}
