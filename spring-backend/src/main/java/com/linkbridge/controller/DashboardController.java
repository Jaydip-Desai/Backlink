package com.linkbridge.controller;

import com.linkbridge.service.AuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuthorizationService authorizationService;

    @GetMapping
    public Map<String, Object> getDashboard() {
        authorizationService.requireAuthenticated();
        int totalDomains = queryCount("SELECT COUNT(*) FROM domains");
        int totalOurReqs = queryCount("SELECT COUNT(*) FROM our_requests");
        int totalClientReqs = queryCount("SELECT COUNT(*) FROM client_requests");
        int totalExchanges = queryCount("SELECT COUNT(*) FROM exchanges");
        int completedExchanges = queryCount("SELECT COUNT(*) FROM exchanges WHERE status='completed'");
        int unbalanced = queryCount("SELECT COUNT(*) FROM exchanges WHERE status='partially_completed'");
        int totalBacklinks = queryCount("SELECT COUNT(*) FROM backlinks");
        int liveBacklinks = queryCount("SELECT COUNT(*) FROM backlinks WHERE status='live'");
        int lostBacklinks = queryCount("SELECT COUNT(*) FROM backlinks WHERE status='lost'");
        int pendingBacklinks = queryCount("SELECT COUNT(*) FROM backlinks WHERE status IN ('pending','submitted','published')");
        int followUpsDue = queryCount("SELECT COUNT(*) FROM follow_ups WHERE status IN ('open','in_progress') AND due_date <= CURRENT_DATE::text");

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("totalDomains", totalDomains);
        kpis.put("totalOurReqs", totalOurReqs);
        kpis.put("totalClientReqs", totalClientReqs);
        kpis.put("totalExchanges", totalExchanges);
        kpis.put("completedExchanges", completedExchanges);
        kpis.put("unbalanced", unbalanced);
        kpis.put("totalBacklinks", totalBacklinks);
        kpis.put("liveBacklinks", liveBacklinks);
        kpis.put("lostBacklinks", lostBacklinks);
        kpis.put("pendingBacklinks", pendingBacklinks);
        kpis.put("followUpsDue", followUpsDue);

        List<Map<String, Object>> backlinksOverTime = jdbcTemplate.queryForList(
            "SELECT acquisition_date AS dt, COUNT(*) AS n, " +
            "SUM(CASE WHEN status='live' THEN 1 ELSE 0 END) AS live, " +
            "SUM(CASE WHEN status='lost' THEN 1 ELSE 0 END) AS lost " +
            "FROM backlinks " +
            "WHERE acquisition_date >= (CURRENT_DATE - INTERVAL '180 days')::text " +
            "GROUP BY acquisition_date ORDER BY dt"
        );

        List<Map<String, Object>> exchangesOverTime = jdbcTemplate.queryForList(
            "SELECT exchange_date AS dt, COUNT(*) AS n, " +
            "SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed, " +
            "SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled " +
            "FROM exchanges " +
            "WHERE exchange_date >= (CURRENT_DATE - INTERVAL '180 days')::text " +
            "GROUP BY exchange_date ORDER BY dt"
        );

        List<Map<String, Object>> statusBreakdown = jdbcTemplate.queryForList(
            "SELECT status, COUNT(*) AS n FROM backlinks GROUP BY status"
        );

        List<Map<String, Object>> linkTypeBreakdown = jdbcTemplate.queryForList(
            "SELECT link_type AS type, COUNT(*) AS n FROM backlinks GROUP BY link_type"
        );

        List<Map<String, Object>> teamPerformance = jdbcTemplate.queryForList(
            "SELECT u.id, u.name, u.avatar_color, " +
            "(SELECT COUNT(*) FROM domains d WHERE d.assigned_to=u.id) AS domains, " +
            "(SELECT COUNT(*) FROM our_requests o WHERE o.assigned_to=u.id) AS our_requests, " +
            "(SELECT COUNT(*) FROM client_requests c WHERE c.assigned_to=u.id) AS client_requests, " +
            "(SELECT COUNT(*) FROM exchanges e WHERE e.assigned_to=u.id) AS exchanges, " +
            "(SELECT COUNT(*) FROM exchanges e WHERE e.assigned_to=u.id AND e.status='completed') AS completed_exchanges, " +
            "(SELECT COUNT(*) FROM backlinks b WHERE b.assigned_to=u.id) AS backlinks, " +
            "(SELECT COUNT(*) FROM backlinks b WHERE b.assigned_to=u.id AND b.status='live') AS live, " +
            "(SELECT COUNT(*) FROM backlinks b WHERE b.assigned_to=u.id AND b.status='lost') AS lost " +
            "FROM users u WHERE u.status='active' AND u.role IN ('executive','manager') " +
            "ORDER BY u.name"
        );

        List<Map<String, Object>> domainDistribution = jdbcTemplate.queryForList(
            "SELECT (da / 10) * 10 AS bucket, COUNT(*) AS n FROM domains WHERE da IS NOT NULL GROUP BY (da / 10) * 10 ORDER BY bucket"
        );

        List<Map<String, Object>> topTargets = jdbcTemplate.queryForList(
            "SELECT b.target_url AS url, COUNT(*) AS n, " +
            "SUM(CASE WHEN b.status='live' THEN 1 ELSE 0 END) AS live " +
            "FROM backlinks b " +
            "GROUP BY b.target_url ORDER BY n DESC LIMIT 10"
        );

        List<Map<String, Object>> recentActivity = jdbcTemplate.queryForList(
            "SELECT a.*, u.avatar_color FROM activity_logs a " +
            "LEFT JOIN users u ON u.id=a.user_id " +
            "ORDER BY a.created_at DESC LIMIT 12"
        );

        Map<String, Object> charts = new LinkedHashMap<>();
        charts.put("backlinksOverTime", backlinksOverTime);
        charts.put("exchangesOverTime", exchangesOverTime);
        charts.put("statusBreakdown", statusBreakdown);
        charts.put("linkTypeBreakdown", linkTypeBreakdown);
        charts.put("teamPerformance", teamPerformance);
        charts.put("domainDistribution", domainDistribution);
        charts.put("topTargets", topTargets);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("kpis", kpis);
        res.put("charts", charts);
        res.put("recentActivity", recentActivity);
        return res;
    }

    private int queryCount(String sql) {
        Integer val = jdbcTemplate.queryForObject(sql, Integer.class);
        return val != null ? val : 0;
    }
}
