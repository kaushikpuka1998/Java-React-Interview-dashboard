package com.interview.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Decides which topics a caller may read.
 *
 * Signed-out visitors get a free sample (configured by app.free-techs) so the site
 * stays crawlable and browsable; everything else needs an account. Enforced here on
 * the server rather than only hidden in the UI, since the API is public.
 */
@Service
public class AccessService {

    private final Set<String> freeTechs;

    public AccessService(@Value("${app.free-techs:}") String csv) {
        this.freeTechs = Arrays.stream(csv.split(","))
                .map(s -> s.trim().toLowerCase())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    /** True when the caller presented a valid token. */
    public boolean isAuthenticated() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        return a != null
                && a.isAuthenticated()
                && a.getName() != null
                && !"anonymousUser".equals(a.getName());
    }

    /** Signed-out callers are limited to the free topics. */
    public boolean isRestricted() {
        return !isAuthenticated();
    }

    public List<String> allowedTechs() {
        // Never return an empty list: an empty IN (...) is invalid in some dialects.
        return freeTechs.isEmpty() ? List.of("__none__") : List.copyOf(freeTechs);
    }

    public Set<String> freeTechs() {
        return freeTechs;
    }

    /** Can the caller read a question of this topic? */
    public boolean canRead(String tech) {
        return isAuthenticated() || (tech != null && freeTechs.contains(tech.toLowerCase()));
    }
}
