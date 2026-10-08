package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuditService auditService;

    @Autowired
    private com.linkbridge.service.AuthorizationService authorizationService;

    @GetMapping
    public Map<String, Object> getSettings() {
        authorizationService.requireRole("admin", "manager");
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM settings ORDER BY key");
        Map<String, String> settings = new LinkedHashMap<>();
        for (Map<String, Object> r : rows) {
            settings.put((String) r.get("key"), (String) r.get("value"));
        }
        return Map.of("settings", settings);
    }

    @PutMapping
    public Map<String, Object> updateSettings(@RequestBody Map<String, Object> body) {
        authorizationService.requireRole("admin");
        Set<String> allowed = Set.of("default_our_website", "allow_registration", "notification_followup_days");
        for (Map.Entry<String, Object> entry : body.entrySet()) {
            if (allowed.contains(entry.getKey())) {
                jdbcTemplate.update(
                        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                        entry.getKey(), String.valueOf(entry.getValue())
                );
            }
        }
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System", "update", "settings", null, "Updated system settings");
        return Map.of("message", "Settings updated.");
    }

    @GetMapping("/statuses")
    public Map<String, Object> getStatuses() {
        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("domains", jdbcTemplate.queryForList("SELECT status, COUNT(*) AS n FROM domains GROUP BY status"));
        counts.put("ourRequests", jdbcTemplate.queryForList("SELECT status, COUNT(*) AS n FROM our_requests GROUP BY status"));
        counts.put("clientRequests", jdbcTemplate.queryForList("SELECT status, COUNT(*) AS n FROM client_requests GROUP BY status"));
        counts.put("exchanges", jdbcTemplate.queryForList("SELECT status, COUNT(*) AS n FROM exchanges GROUP BY status"));
        counts.put("backlinks", jdbcTemplate.queryForList("SELECT status, COUNT(*) AS n FROM backlinks GROUP BY status"));
        return Map.of("counts", counts);
    }

    @GetMapping("/backup")
    public Map<String, Object> getBackup() {
        authorizationService.requireRole("admin");
        return Map.of("backupStrategy",
                "PostgreSQL Backup Strategy:\n" +
                "1. Database: linkbridge_db on PostgreSQL 17.\n" +
                "2. Standard backup via pg_dump:\n" +
                "   pg_dump -U linkbridge -d linkbridge_db -F c -b -v -f linkbridge_backup.dump\n" +
                "3. Restore:\n" +
                "   pg_restore -U linkbridge -d linkbridge_db -v linkbridge_backup.dump"
        );
    }
}
