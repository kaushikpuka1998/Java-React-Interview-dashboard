package com.interview.backend.service;

import com.interview.backend.entity.User;
import com.interview.backend.repository.UserEventRepository;
import com.interview.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Weekly XP, leagues and the leaderboard. XP only counts reads from the last 7 days,
 * so a member who stops reading drops off the board on their own.
 */
@Service
@RequiredArgsConstructor
public class LeagueService {

    public static final int WINDOW_DAYS = 7;
    public static final int XP_PER_READ = 10;
    public static final int BOARD_SIZE = 100;

    /** Lowest weekly XP for each league, highest first. */
    public static final List<Map.Entry<String, Long>> TIERS = List.of(
            Map.entry("Platinum", 300L), Map.entry("Gold", 150L), Map.entry("Silver", 50L), Map.entry("Bronze", 10L));

    public record Standing(long userId, String username, String name, long xp, String league, int rank) {}

    private final UserEventRepository events;
    private final UserRepository users;

    public static String league(long xp) {
        for (var t : TIERS) if (xp >= t.getValue()) return t.getKey();
        return "Unranked";
    }

    private static Instant since() {
        return Instant.now().minus(WINDOW_DAYS, ChronoUnit.DAYS);
    }

    public long weeklyXp(Long userId) {
        return events.weeklyReadCount(userId, since()) * XP_PER_READ;
    }

    /** Members need a country and city to appear on the board. */
    public static boolean hasLocation(User u) {
        return u != null && u.getCountry() != null && u.getCity() != null;
    }

    public List<Standing> board() {
        List<Object[]> rows = events.weeklyReaders(since(), BOARD_SIZE);
        List<Long> ids = rows.stream().map(r -> ((Number) r[0]).longValue()).toList();
        Map<Long, User> byId = ids.isEmpty() ? Map.of() : users.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<Standing> board = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            long id = ids.get(i);
            long xp = ((Number) rows.get(i)[1]).longValue() * XP_PER_READ;
            User u = byId.get(id);
            if (!hasLocation(u)) continue;   // the leaderboard is for members with a country and city
            String name = u == null || u.getName() == null || u.getName().isBlank() ? "Learner" : u.getName();
            String username = u == null || u.getUsername() == null ? "" : u.getUsername();
            board.add(new Standing(id, username, name, xp, league(xp), board.size() + 1));
        }
        return board;
    }
}
