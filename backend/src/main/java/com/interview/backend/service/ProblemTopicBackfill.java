package com.interview.backend.service;

import com.interview.backend.entity.CodingProblem;
import com.interview.backend.repository.CodingProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/** On startup, gives every coding problem that has no topics a guessed set. Problems already tagged are left alone. */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProblemTopicBackfill implements CommandLineRunner {

    private final CodingProblemRepository problems;

    @Override
    public void run(String... args) {
        List<CodingProblem> untagged = problems.findByTopicsIsNull();
        if (untagged.isEmpty()) return;
        for (CodingProblem p : untagged) p.setTopics(TopicTagger.infer(p.getTitle(), p.getStatement()));
        problems.saveAll(untagged);
        log.info("Tagged {} coding problems with topics", untagged.size());
    }
}
