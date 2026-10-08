package com.linkbridge.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SequenceService {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public synchronized String nextRef(String prefix, String code) {
        String table = switch (code) {
            case "domain" -> "domains";
            case "our_request" -> "our_requests";
            case "client_request" -> "client_requests";
            case "exchange" -> "exchanges";
            case "backlink" -> "backlinks";
            case "follow_up" -> "follow_ups";
            case "contact" -> "contacts";
            default -> null;
        };

        if (table != null) {
            try {
                jdbcTemplate.update(
                    "INSERT INTO sequences (code, value) " +
                    "SELECT ?, COALESCE(MAX(CAST(NULLIF(regexp_replace(ref, '[^0-9]', '', 'g'), '') AS INTEGER)), 0) FROM " + table + " " +
                    "ON CONFLICT (code) DO UPDATE SET value = GREATEST(sequences.value, EXCLUDED.value)",
                    code
                );
            } catch (Exception ignored) {}
        }

        jdbcTemplate.update(
            "INSERT INTO sequences (code, value) VALUES (?, 1) " +
            "ON CONFLICT (code) DO UPDATE SET value = sequences.value + 1",
            code
        );
        Integer val = jdbcTemplate.queryForObject(
            "SELECT value FROM sequences WHERE code = ?",
            Integer.class,
            code
        );
        return String.format("%s-%05d", prefix, val != null ? val : 1);
    }
}
