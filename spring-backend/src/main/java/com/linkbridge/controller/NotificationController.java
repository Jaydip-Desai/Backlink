package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuthorizationService authorizationService;

    @GetMapping
    public Map<String, Object> getNotifications(
            @RequestParam(required = false) Boolean unread_only,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "30") int limit
    ) {
        authorizationService.requireAuthenticated();
        limit = Math.max(1, Math.min(limit, 100));
        page = Math.max(1, page);

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        Long userId = user != null ? user.getId() : null;

        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (userId != null) {
            where.append(" AND (user_id = ? OR user_id IS NULL)");
            params.add(userId);
        }
        if (Boolean.TRUE.equals(unread_only)) {
            where.append(" AND is_read = 0");
        }

        String dataSql = "SELECT * FROM notifications" + where + " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(limit);
        dataParams.add((page - 1) * limit);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(dataSql, dataParams.toArray());

        int unread = 0;
        if (userId != null) {
            Integer unreadVal = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM notifications WHERE is_read = 0 AND (user_id = ? OR user_id IS NULL)",
                    Integer.class, userId
            );
            unread = unreadVal != null ? unreadVal : 0;
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("notifications", rows);
        res.put("unread", unread);
        res.put("total", rows.size());
        return res;
    }

    @PostMapping("/scan")
    public Map<String, Object> scan() {
        authorizationService.requireAuthenticated();
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        Long userId = user != null ? user.getId() : null;

        List<Map<String, Object>> due = jdbcTemplate.queryForList(
                "SELECT f.*, d.domain FROM follow_ups f LEFT JOIN domains d ON d.id = f.domain_id " +
                "WHERE f.status IN ('open','in_progress') AND f.due_date <= CURRENT_DATE::text"
        );

        for (Map<String, Object> f : due) {
            String title = "Follow-up due: " + (f.get("domain") != null ? f.get("domain") : f.get("ref"));
            String msg = "Follow-up (" + f.get("kind") + ") is due for " + f.get("domain");
            Object assigned = f.get("assigned_to");

            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM notifications WHERE title = ? AND DATE(created_at) = CURRENT_DATE",
                    Integer.class, title
            );
            if (count == null || count == 0) {
                jdbcTemplate.update(
                        "INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at) " +
                        "VALUES (?, 'follow_up', ?, ?, '/followups', 0, CURRENT_TIMESTAMP)",
                        assigned, title, msg
                );
            }
        }

        int unread = 0;
        if (userId != null) {
            Integer unreadVal = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM notifications WHERE is_read = 0 AND (user_id = ? OR user_id IS NULL)",
                    Integer.class, userId
            );
            unread = unreadVal != null ? unreadVal : 0;
        }

        return Map.of("message", "Notifications refreshed.", "unread", unread);
    }

    @PostMapping("/read")
    public Map<String, Object> markRead(@RequestBody(required = false) Map<String, Object> body) {
        authorizationService.requireAuthenticated();
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        Long userId = user != null ? user.getId() : null;

        Object idObj = body != null ? body.get("id") : null;
        if (idObj != null) {
            Long notifId = Long.valueOf(String.valueOf(idObj));
            jdbcTemplate.update("UPDATE notifications SET is_read = 1 WHERE id = ?", notifId);
        } else if (userId != null) {
            jdbcTemplate.update("UPDATE notifications SET is_read = 1 WHERE (user_id = ? OR user_id IS NULL)", userId);
        } else {
            jdbcTemplate.update("UPDATE notifications SET is_read = 1");
        }

        return Map.of("message", "Marked as read.");
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        authorizationService.requireAuthenticated();
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        Long userId = user != null ? user.getId() : null;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT user_id FROM notifications WHERE id = ?", id);
        if (!rows.isEmpty()) {
            Object owner = rows.get(0).get("user_id");
            if (!authorizationService.isAdminOrManager(user) && owner != null && !owner.toString().equals(String.valueOf(userId))) {
                throw new AccessDeniedException("Cannot delete another user's notification.");
            }
        }
        jdbcTemplate.update("DELETE FROM notifications WHERE id = ?", id);
        return Map.of("message", "Notification deleted.");
    }
}
