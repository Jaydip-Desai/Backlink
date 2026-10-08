package com.linkbridge.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/team")
public class TeamMemberController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public Map<String, Object> getTeam() {
        List<Map<String, Object>> members = jdbcTemplate.queryForList(
                "SELECT u.id, u.name, u.email, u.role, u.title, u.avatar_color, u.status, " +
                "(SELECT COUNT(*) FROM domains d WHERE d.assigned_to=u.id) AS domains, " +
                "(SELECT COUNT(*) FROM our_requests o WHERE o.assigned_to=u.id) AS our_requests, " +
                "(SELECT COUNT(*) FROM client_requests c WHERE c.assigned_to=u.id) AS client_requests, " +
                "(SELECT COUNT(*) FROM exchanges e WHERE e.assigned_to=u.id) AS exchanges, " +
                "(SELECT COUNT(*) FROM exchanges e2 WHERE e2.assigned_to=u.id AND e2.status='completed') AS completed_exchanges, " +
                "(SELECT COUNT(*) FROM backlinks b WHERE b.assigned_to=u.id) AS backlinks, " +
                "(SELECT COUNT(*) FROM backlinks b WHERE b.assigned_to=u.id AND b.status='live') AS live_backlinks, " +
                "(SELECT COUNT(*) FROM backlinks b WHERE b.assigned_to=u.id AND b.status='lost') AS lost_backlinks, " +
                "(SELECT COUNT(*) FROM follow_ups f WHERE f.assigned_to=u.id) AS follow_ups, " +
                "(SELECT COUNT(*) FROM follow_ups f WHERE f.assigned_to=u.id AND f.status='completed') AS completed_follow_ups " +
                "FROM users u WHERE u.status='active' ORDER BY u.name"
        );
        return Map.of("members", members);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMember(@PathVariable Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, name, email, role, title, avatar_color, created_at, last_login_at FROM users WHERE id = ?", id
        );
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found."));
        }
        List<Map<String, Object>> activity = jdbcTemplate.queryForList(
                "SELECT a.*, u.avatar_color FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 20", id
        );
        return ResponseEntity.ok(Map.of("member", rows.get(0), "recentActivity", activity));
    }
}
