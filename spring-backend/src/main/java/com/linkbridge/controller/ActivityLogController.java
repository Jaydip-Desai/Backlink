package com.linkbridge.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/activity")
public class ActivityLogController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.linkbridge.service.AuthorizationService authorizationService;

    @GetMapping
    public Map<String, Object> getActivity(
            @RequestParam(required = false) Integer user_id,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entity_type,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "50") int limit
    ) {
        authorizationService.requireRole("admin", "manager");
        limit = Math.min(Math.max(1, limit), 100);
        page = Math.max(1, page);
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (user_id != null) {
            where.append(" AND a.user_id = ?");
            params.add(user_id);
        }
        if (action != null && !action.trim().isEmpty()) {
            where.append(" AND a.action = ?");
            params.add(action.trim());
        }
        if (entity_type != null && !entity_type.trim().isEmpty()) {
            where.append(" AND a.entity_type = ?");
            params.add(entity_type.trim());
        }
        if (from != null && !from.trim().isEmpty()) {
            where.append(" AND a.created_at >= ?::timestamp");
            params.add(from.trim());
        }
        if (to != null && !to.trim().isEmpty()) {
            where.append(" AND a.created_at <= (? || ' 23:59:59')::timestamp");
            params.add(to.trim());
        }

        String countSql = "SELECT COUNT(*) FROM activity_logs a" + where;
        int total = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());

        String dataSql = "SELECT a.*, u.avatar_color, u.role AS user_role FROM activity_logs a " +
                "LEFT JOIN users u ON u.id = a.user_id" + where +
                " ORDER BY a.created_at DESC LIMIT ? OFFSET ?";

        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(limit);
        dataParams.add((page - 1) * limit);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(dataSql, dataParams.toArray());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("logs", rows);
        res.put("total", total);
        res.put("page", page);
        res.put("limit", limit);
        res.put("totalPages", (int) Math.ceil((double) total / limit));
        return res;
    }
}
