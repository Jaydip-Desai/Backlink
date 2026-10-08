package com.linkbridge.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/targets")
public class TargetUrlController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public Map<String, Object> getTargets(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "total_backlinks") String sort,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "25") int limit
    ) {
        List<String> urls = jdbcTemplate.queryForList(
                "SELECT DISTINCT target_url FROM backlinks UNION SELECT DISTINCT client_target_url FROM client_requests",
                String.class
        );
        urls.removeIf(Objects::isNull);

        List<Map<String, Object>> rows = new ArrayList<>();
        for (String u : urls) {
            List<Map<String, Object>> bls = jdbcTemplate.queryForList(
                    "SELECT status, referring_domain FROM backlinks WHERE target_url = ?", u
            );
            int live = 0, lost = 0, pending = 0;
            Set<String> refDoms = new HashSet<>();
            for (Map<String, Object> b : bls) {
                String st = (String) b.get("status");
                if ("live".equalsIgnoreCase(st)) live++;
                else if ("lost".equalsIgnoreCase(st)) lost++;
                else pending++;
                if (b.get("referring_domain") != null) refDoms.add((String) b.get("referring_domain"));
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("url", u);
            row.put("title", null);
            row.put("total_backlinks", bls.size());
            row.put("live", live);
            row.put("lost", lost);
            row.put("pending", pending);
            row.put("referring_domains", refDoms.size());
            rows.add(row);
        }

        if (search != null && !search.trim().isEmpty()) {
            String s = search.trim().toLowerCase();
            rows.removeIf(r -> !((String) r.get("url")).toLowerCase().contains(s));
        }

        boolean asc = "asc".equalsIgnoreCase(order);
        if ("live".equalsIgnoreCase(sort)) {
            rows.sort((a, b) -> asc ? Integer.compare((int) a.get("live"), (int) b.get("live")) : Integer.compare((int) b.get("live"), (int) a.get("live")));
        } else if ("url".equalsIgnoreCase(sort)) {
            rows.sort((a, b) -> asc ? ((String) a.get("url")).compareTo((String) b.get("url")) : ((String) b.get("url")).compareTo((String) a.get("url")));
        } else {
            rows.sort((a, b) -> asc ? Integer.compare((int) a.get("total_backlinks"), (int) b.get("total_backlinks")) : Integer.compare((int) b.get("total_backlinks"), (int) a.get("total_backlinks")));
        }

        int total = rows.size();
        int from = Math.min((page - 1) * limit, total);
        int to = Math.min(from + limit, total);
        List<Map<String, Object>> paged = rows.subList(from, to);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("targets", paged);
        res.put("total", total);
        res.put("page", page);
        res.put("limit", limit);
        res.put("totalPages", (int) Math.ceil((double) total / limit));
        return res;
    }
}
