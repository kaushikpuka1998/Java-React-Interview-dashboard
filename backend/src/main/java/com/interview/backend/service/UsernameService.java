package com.interview.backend.service;

import com.interview.backend.entity.User;
import com.interview.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Usernames for public profile URLs (/u/{username}).
 * Rules: 3-30 chars, starts with a letter, then letters, digits or underscores. Stored lowercase.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UsernameService {

    private static final Pattern VALID = Pattern.compile("^[a-z][a-z0-9_]{2,29}$");
    private static final Set<String> RESERVED = Set.of(
            "admin", "api", "u", "me", "profile", "profiles", "leaderboard", "login", "logout", "signup",
            "register", "reset", "reset-password", "auth", "public", "support", "help", "about", "settings",
            "null", "undefined", "root", "system", "interview", "interviewreader");

    private final UserRepository users;
    private final UsernameBloom bloom;

    /** Normalises and validates. Throws IllegalArgumentException with a message fit to show. */
    public static String validate(String raw) {
        String u = raw == null ? "" : raw.trim().toLowerCase();
        if (u.isEmpty()) throw new IllegalArgumentException("Username is required");
        if (!VALID.matcher(u).matches()) {
            throw new IllegalArgumentException("Use 3-30 letters, numbers or _, starting with a letter");
        }
        if (RESERVED.contains(u)) throw new IllegalArgumentException("That username is reserved");
        return u;
    }

    /** Free = the filter says no (certain), or the database confirms no. */
    public boolean isAvailable(String username) {
        return !bloom.mightContain(username) || !users.existsByUsername(username);
    }

    /** Fast path for /u/{username}: the filter rejects most misses without touching the database. */
    public Optional<User> resolve(String username) {
        if (!bloom.mightContain(username)) return Optional.empty();
        return users.findByUsername(username);
    }

    /** A username from the display name or email, made unique by adding a number if needed. */
    public String generate(String name, String email) {
        String base = name == null || name.isBlank() ? email.substring(0, email.indexOf('@')) : name;
        String clean = base.toLowerCase().replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
        if (clean.isEmpty() || !Character.isLetter(clean.charAt(0))) clean = "user" + clean;
        if (clean.length() > 24) clean = clean.substring(0, 24);
        if (clean.length() < 3) clean = clean + "_user";
        String candidate = clean;
        for (int n = 2; RESERVED.contains(candidate) || !isAvailable(candidate); n++) {
            candidate = clean + n;
        }
        return candidate;
    }

    /** Remember a newly taken username. Call after the user is saved. */
    public void taken(String username) {
        bloom.add(username);
    }

    /** Loads every existing username into the filter at startup, and fills in any missing ones. */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void startup() {
        for (User u : users.findByUsernameIsNull()) {
            String name = generate(u.getName(), u.getEmail());
            u.setUsername(name);
            users.saveAndFlush(u);   // flush so the next generate() sees this name
            taken(name);
        }
        refresh();
    }

    // ponytail: refresh re-adds everything every 10 min so other instances' usernames show up.
    // Bits are only set, so a refresh can't cause a false "no"; it just catches up.
    @Scheduled(fixedDelayString = "PT10M")
    public void refresh() {
        List<String> all = users.findAllUsernames();
        all.forEach(bloom::add);
        log.debug("Username filter loaded {} names", all.size());
    }
}
