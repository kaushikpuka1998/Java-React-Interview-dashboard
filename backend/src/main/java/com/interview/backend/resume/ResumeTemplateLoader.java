package com.interview.backend.resume;

import com.interview.backend.entity.ResumeTemplate;
import com.interview.backend.repository.ResumeTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

/**
 * Loads every resources/resume-templates/*.tex into the database on startup.
 * Header comments set the name, description and layout; the file name is the slug.
 * Editing a file and restarting updates the template; members' resumes follow it.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ResumeTemplateLoader {

    private final ResumeTemplateRepository templates;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void load() throws Exception {
        Resource[] files = new PathMatchingResourcePatternResolver().getResources("classpath:resume-templates/*.tex");
        for (Resource file : files) {
            String text = new String(file.getContentAsByteArray(), StandardCharsets.UTF_8);
            String slug = file.getFilename().replace(".tex", "");
            ResumeTemplate t = templates.findBySlug(slug).orElseGet(ResumeTemplate::new);
            t.setSlug(slug);
            t.setName(header(text, "name", slug));
            t.setDescription(header(text, "description", ""));
            t.setLayout(header(text, "layout", "header,summary,skills,experience,projects,education,achievements"));
            t.setPreamble(text);
            templates.save(t);
            log.info("Resume template '{}' loaded", slug);
        }
    }

    private static String header(String text, String key, String fallback) {
        for (String line : text.split("\n")) {
            String prefix = "% " + key + ":";
            if (line.startsWith(prefix)) return line.substring(prefix.length()).trim();
            if (!line.startsWith("%")) break;   // headers stop at the first non-comment line
        }
        return fallback;
    }
}
