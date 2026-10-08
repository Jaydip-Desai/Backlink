package com.linkbridge.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void logActivity(Long userId, String userName, String action, String entityType, String entityRef, String message) {
        try {
            jdbcTemplate.update(
                "INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_ref, message, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                userId, userName, action, entityType, entityRef, message
            );
        } catch (Exception e) {
            System.err.println("Failed to log activity: " + e.getMessage());
        }
    }
}
