package com.linkbridge.security;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private static class Attempt {
        int count;
        long firstAttemptTime;
        long lockedUntil;

        Attempt(long now) {
            this.count = 1;
            this.firstAttemptTime = now;
            this.lockedUntil = 0;
        }
    }

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MS = 60 * 1000; // 1 minute lockout
    private static final long WINDOW_MS = 60 * 1000;

    public synchronized boolean isBlocked(String key) {
        long now = System.currentTimeMillis();
        Attempt a = attempts.get(key);
        if (a == null) return false;
        if (a.lockedUntil > now) return true;
        if (now - a.firstAttemptTime > WINDOW_MS && a.lockedUntil <= now) {
            attempts.remove(key);
            return false;
        }
        return false;
    }

    public synchronized void recordFailure(String key) {
        long now = System.currentTimeMillis();
        Attempt a = attempts.get(key);
        if (a == null) {
            attempts.put(key, new Attempt(now));
        } else {
            if (now - a.firstAttemptTime > WINDOW_MS) {
                a.count = 1;
                a.firstAttemptTime = now;
            } else {
                a.count++;
                if (a.count >= MAX_ATTEMPTS) {
                    a.lockedUntil = now + LOCK_DURATION_MS;
                }
            }
        }
    }

    public synchronized void reset(String key) {
        attempts.remove(key);
    }
}
