package com.interview.backend.service;

import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.atomic.AtomicLongArray;

/**
 * Bloom filter over taken usernames. "No" is always right; "maybe" needs a database check.
 * That makes "is this username free?" and "does /u/{name} exist?" cheap for the common miss.
 *
 * ~8.4M bits (1 MB) with 7 hashes: about 1% false positives up to ~1M usernames.
 * Bits are only ever set, never cleared, so a re-add from the database is always safe.
 */
@Component
public class UsernameBloom {

    private static final long BITS = 1L << 23;
    private static final int HASHES = 7;
    private final AtomicLongArray words = new AtomicLongArray((int) (BITS / 64));

    public void add(String username) {
        long[] h = hashes(username);
        for (int i = 0; i < HASHES; i++) {
            long bit = Math.floorMod(h[0] + i * h[1], BITS);
            words.getAndAccumulate((int) (bit >>> 6), 1L << (bit & 63), (a, b) -> a | b);
        }
    }

    /** false = definitely not taken. true = taken, or a rare false positive. */
    public boolean mightContain(String username) {
        long[] h = hashes(username);
        for (int i = 0; i < HASHES; i++) {
            long bit = Math.floorMod(h[0] + i * h[1], BITS);
            if ((words.get((int) (bit >>> 6)) & (1L << (bit & 63))) == 0) return false;
        }
        return true;
    }

    /** Two independent 64-bit hashes from SHA-256, used for double hashing. */
    private static long[] hashes(String s) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(s.toLowerCase().getBytes(StandardCharsets.UTF_8));
            ByteBuffer b = ByteBuffer.wrap(d);
            return new long[]{b.getLong(), b.getLong()};
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
