package com.linkbridge.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/anchors")
public class AnchorTextController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public Map<String, Object> getAnchors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "n") String sort,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "25") int limit
    ) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT anchor_text, COUNT(*) AS n, " +
                "SUM(CASE WHEN status='live' THEN 1 ELSE 0 END) AS live, " +
                "SUM(CASE WHEN status='lost' THEN 1 ELSE 0 END) AS lost, " +
                "SUM(CASE WHEN link_type='dofollow' THEN 1 ELSE 0 END) AS dofollow, " +
                "SUM(CASE WHEN link_type='nofollow' THEN 1 ELSE 0 END) AS nofollow " +
                "FROM backlinks WHERE anchor_text IS NOT NULL AND anchor_text != '' " +
                "GROUP BY anchor_text"
        );

        List<Map<String, Object>> distribution = jdbcTemplate.queryForList(
                "SELECT link_type AS type, COUNT(*) AS n FROM backlinks GROUP BY link_type"
        );

        for (Map<String, Object> r : rows) {
            String text = (String) r.get("anchor_text");
            r.put("normalized", text != null ? text.trim().toLowerCase() : "");
        }

        if (search != null && !search.trim().isEmpty()) {
            String s = search.trim().toLowerCase();
            rows.removeIf(r -> !((String) r.get("anchor_text")).toLowerCase().contains(s));
        }

        boolean asc = "asc".equalsIgnoreCase(order);
        if ("anchor_text".equalsIgnoreCase(sort)) {
            java.util.Comparator<Map<String, Object>> cmp = java.util.Comparator.comparing(m -> (String) m.get("anchor_text"));
            rows.sort(asc ? cmp : cmp.reversed());
        } else if ("live".equalsIgnoreCase(sort)) {
            java.util.Comparator<Map<String, Object>> cmp = java.util.Comparator.comparingLong(m -> ((Number) m.get("live")).longValue());
            rows.sort(asc ? cmp : cmp.reversed());
        } else {
            java.util.Comparator<Map<String, Object>> cmp = java.util.Comparator.comparingLong(m -> ((Number) m.get("n")).longValue());
            rows.sort(asc ? cmp : cmp.reversed());
        }

        int total = rows.size();
        int from = Math.min((page - 1) * limit, total);
        int to = Math.min(from + limit, total);
        List<Map<String, Object>> paged = rows.subList(from, to);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("anchors", paged);
        res.put("distribution", distribution);
        res.put("total", total);
        res.put("page", page);
        res.put("limit", limit);
        res.put("totalPages", (int) Math.ceil((double) total / limit));
        return res;
    }
}
