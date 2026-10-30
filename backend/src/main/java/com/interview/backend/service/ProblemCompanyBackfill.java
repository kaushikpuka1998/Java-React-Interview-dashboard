package com.interview.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.backend.entity.CodingProblem;
import com.interview.backend.repository.CodingProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * On startup, fills in which companies ask each coding problem, from problem-companies.json
 * (built by scripts/gen-problem-companies.py). Only problems with no company data yet are touched,
 * so later edits are kept. A problem no company asks gets an empty string so it is not rechecked.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProblemCompanyBackfill implements CommandLineRunner {

    private final CodingProblemRepository problems;

    /** Same normalisation the generator uses: lower case, punctuation collapsed to single spaces. */
    static String key(String title) {
        return title == null ? "" : title.toLowerCase().replaceAll("[^a-z0-9]+", " ").trim();
    }

    private static volatile Map<String, List<String>> table;

    /** The companies that ask a problem with this title, comma separated; empty when none is known. */
    public static String companiesFor(String title) {
        if (table == null) {
            try (InputStream in = new ClassPathResource("problem-companies.json").getInputStream()) {
                table = new ObjectMapper().readValue(in, new TypeReference<Map<String, List<String>>>() {});
            } catch (Exception e) {
                table = Map.of();
            }
        }
        List<String> names = table.get(key(title));
        return names == null ? "" : String.join(",", names);
    }

    @Override
    public void run(String... args) {
        List<CodingProblem> todo = problems.findByCompaniesIsNullOrCompanies("");
        if (todo.isEmpty()) return;
        int tagged = 0;
        for (CodingProblem p : todo) {
            p.setCompanies(companiesFor(p.getTitle()));
            if (!p.getCompanies().isEmpty()) tagged++;
        }
        problems.saveAll(todo);
        log.info("Company data added to {} of {} coding problems", tagged, todo.size());
    }
}
