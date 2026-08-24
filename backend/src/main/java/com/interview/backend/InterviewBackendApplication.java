package com.interview.backend;

import com.interview.backend.config.DatabaseInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class InterviewBackendApplication {
    public static void main(String[] args) {
        // Ensure the target Postgres database (e.g. interviewdb) exists before Hikari/Flyway
        // attempt to connect to it.
        DatabaseInitializer.ensureDatabaseExists();
        SpringApplication.run(InterviewBackendApplication.class, args);
    }
}