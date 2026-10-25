package com.interview.backend.resume;

import com.interview.backend.entity.ResumeTemplate;
import com.interview.backend.repository.ResumeRepository;
import com.interview.backend.repository.ResumeTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Checks a template before it's saved: name, section order and LaTeX preamble. */
@Service
@RequiredArgsConstructor
public class ResumeTemplateService {

    public static final Set<String> SECTIONS = Set.of("header", "summary", "skills", "experience", "projects", "education", "achievements");

    private final ResumeTemplateRepository templates;
    private final ResumeRepository resumes;

    /**
     * Keeps only the preamble: everything before \\begin{document}. The body is generated from the
     * member's details, so a pasted full document loses its body here.
     */
    public String toPreamble(String pasted) {
        if (pasted == null) return null;
        int cut = pasted.indexOf("\\begin{document}");
        if (cut < 0) cut = pasted.indexOf("\\end{document}");
        return cut < 0 ? pasted : pasted.substring(0, cut).stripTrailing() + "\n";
    }

    /** Throws IllegalArgumentException with a message to show the admin. */
    public void validate(String name, String layout, String preamble) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Name is required");
        if (name.length() > 120) throw new IllegalArgumentException("Name is too long (max 120 characters)");
        List<String> sections = Arrays.stream((layout == null ? "" : layout).split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
        if (sections.isEmpty()) throw new IllegalArgumentException("Choose at least one section");
        for (String s : sections) {
            if (!SECTIONS.contains(s)) throw new IllegalArgumentException("Unknown section: " + s + ". Use: " + String.join(", ", SECTIONS));
        }
        if (preamble == null || !preamble.contains("\\documentclass")) {
            throw new IllegalArgumentException("The LaTeX must start with \\documentclass");
        }
        if (preamble.length() > TexCompiler.MAX_CHARS) throw new IllegalArgumentException("The LaTeX is too large");
    }

    public String slugFor(String name) {
        String base = name.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        return base.isEmpty() ? "template" : base;
    }

    /** A slug that no other template uses, for a new template. */
    public String uniqueSlug(String name) {
        String base = slugFor(name), candidate = base;
        for (int n = 2; templates.findBySlug(candidate).isPresent(); n++) candidate = base + "-" + n;
        return candidate;
    }

    public boolean inUse(Long templateId) {
        return resumes.existsByTemplateId(templateId);
    }
}
