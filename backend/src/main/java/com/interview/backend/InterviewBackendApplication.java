package com.interview.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class InterviewBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(InterviewBackendApplication.class, args);
    }
}