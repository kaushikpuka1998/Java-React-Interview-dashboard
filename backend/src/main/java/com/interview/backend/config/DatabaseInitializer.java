package com.interview.backend.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Ensures the target application database exists before the Spring context (and, in turn,
 * Hikari/Flyway) attempts to open a connection to it.
 *
 * <p>Railway (and most managed Postgres providers) only guarantee that the default
 * {@code postgres} database exists. If {@code DATABASE_URL} points at a database such as
 * {@code interviewdb} that has not been created yet, both the connection pool and Flyway fail
 * fast with "FATAL: database ... does not exist" before any migration ever runs.
 *
 * <p>This runs once, very early, using a short-lived {@link DriverManager} connection to the
 * default {@code postgres} database, creating the target database if it is missing. It is
 * invoked from {@code main()} before {@code SpringApplication.run(...)} so the autoconfigured
 * datasource and Flyway always have a database to connect to.
 */
public final class DatabaseInitializer {

    private static final String DEFAULT_DATABASE = "postgres";

    private DatabaseInitializer() {
    }

    public static void ensureDatabaseExists() {
        String databaseUrl = System.getenv("DATABASE_URL");
        String username = System.getenv("DATABASE_USER");
        String password = System.getenv("DATABASE_PASSWORD");

        if (databaseUrl == null || databaseUrl.isBlank() || !databaseUrl.startsWith("jdbc:")) {
            // Nothing to do for local/test profiles (e.g. H2) that don't use this variable.
            return;
        }

        String targetDatabase = extractDatabaseName(databaseUrl);
        if (targetDatabase == null || targetDatabase.isBlank() || DEFAULT_DATABASE.equals(targetDatabase)) {
            return;
        }

        String adminUrl = databaseUrl.replace("/" + targetDatabase, "/" + DEFAULT_DATABASE);

        try (Connection connection = DriverManager.getConnection(adminUrl, username, password)) {
            boolean exists;
            try (Statement statement = connection.createStatement();
                 ResultSet resultSet = statement.executeQuery(
                         "SELECT 1 FROM pg_database WHERE datname = '" + targetDatabase + "'")) {
                exists = resultSet.next();
            }

            if (!exists) {
                try (Statement statement = connection.createStatement()) {
                    statement.executeUpdate("CREATE DATABASE \"" + targetDatabase + "\"");
                }
            }
        } catch (Exception e) {
            // Don't block startup on this best-effort step; if it truly can't be created,
            // the subsequent Flyway/Hikari connection attempt will surface the real error.
            System.err.println("Warning: could not verify/create database '" + targetDatabase
                    + "': " + e.getMessage());
        }
    }

    private static String extractDatabaseName(String jdbcUrl) {
        int lastSlash = jdbcUrl.lastIndexOf('/');
        if (lastSlash == -1) {
            return null;
        }
        String rest = jdbcUrl.substring(lastSlash + 1);
        int queryIndex = rest.indexOf('?');
        return queryIndex == -1 ? rest : rest.substring(0, queryIndex);
    }
}
