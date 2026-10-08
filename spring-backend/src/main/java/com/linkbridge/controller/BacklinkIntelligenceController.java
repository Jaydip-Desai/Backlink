package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import com.linkbridge.service.AuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/intelligence")
public class BacklinkIntelligenceController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuthorizationService authorizationService;

    @Autowired
    private AuditService auditService;

    /**
     * Dashboard & Overview Summary Statistics
     */
    @GetMapping("/summary")
    public Map<String, Object> getSummary(@RequestParam(required = false) Long project_id) {
        authorizationService.requireAuthenticated();

        String projClause = project_id != null ? " WHERE project_id = " + project_id : "";
        String andProj = project_id != null ? " AND project_id = " + project_id : "";

        Integer totalBacklinks = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM backlinks" + projClause, Integer.class);
        Integer referringDomains = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT referring_domain) FROM backlinks" + projClause, Integer.class);
        Integer dofollow = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM backlinks WHERE (follow_type = 'dofollow' OR link_type = 'dofollow')" + andProj, Integer.class);
        Integer nofollow = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM backlinks WHERE (follow_type = 'nofollow' OR link_type = 'nofollow')" + andProj, Integer.class);
        Integer newLinks = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM backlinks WHERE status = 'new'" + andProj, Integer.class);
        Integer lostLinks = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM backlinks WHERE status = 'lost'" + andProj, Integer.class);
        Integer brokenLinks = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM backlinks WHERE (http_status >= 400 OR status = 'broken')" + andProj, Integer.class);
        Integer riskyLinks = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM backlinks WHERE risk_score >= 50" + andProj, Integer.class);

        // Calculate average domain authority
        Double avgDa = jdbcTemplate.queryForObject(
                "SELECT COALESCE(AVG(da), 52.0) FROM backlinks" + projClause, Double.class);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total_backlinks", totalBacklinks != null ? totalBacklinks : 0);
        stats.put("referring_domains", referringDomains != null ? referringDomains : 0);
        stats.put("dofollow", dofollow != null ? dofollow : 0);
        stats.put("nofollow", nofollow != null ? nofollow : 0);
        stats.put("new_links", newLinks != null ? newLinks : 0);
        stats.put("lost_links", lostLinks != null ? lostLinks : 0);
        stats.put("broken_links", brokenLinks != null ? brokenLinks : 0);
        stats.put("risky_links", riskyLinks != null ? riskyLinks : 0);
        stats.put("avg_domain_authority", avgDa != null ? Math.round(avgDa) : 52);

        return stats;
    }

    /**
     * Referring IP & Subnet Analysis (PBN / Network Concentration Detection)
     */
    @GetMapping("/referring-ips")
    public List<Map<String, Object>> getReferringIps(@RequestParam(required = false) Long project_id) {
        authorizationService.requireAuthenticated();

        String projClause = project_id != null ? " WHERE project_id = " + project_id : "";

        String sql = "SELECT ip_address, subnet, asn, " +
                "COUNT(*) AS backlink_count, " +
                "COUNT(DISTINCT referring_domain) AS domain_count, " +
                "STRING_AGG(DISTINCT referring_domain, ', ') AS sample_domains " +
                "FROM backlinks " + projClause +
                " GROUP BY ip_address, subnet, asn " +
                "ORDER BY domain_count DESC LIMIT 50";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

        for (Map<String, Object> row : rows) {
            int domainCount = ((Number) row.get("domain_count")).intValue();
            String subnet = (String) row.get("subnet");

            // Evaluate explainable network pattern
            if (domainCount >= 5) {
                row.put("pattern_notice", "Potential network concentration: Multiple referring domains (" + domainCount + ") sharing identical " + subnet + " subnet.");
                row.put("is_concentrated", true);
            } else {
                row.put("pattern_notice", "Standard hosting distribution.");
                row.put("is_concentrated", false);
            }
        }

        return rows;
    }

    /**
     * Top Linked Pages Analysis
     */
    @GetMapping("/top-pages")
    public List<Map<String, Object>> getTopPages(@RequestParam(required = false) Long project_id) {
        authorizationService.requireAuthenticated();

        String projClause = project_id != null ? " WHERE project_id = " + project_id : "";

        String sql = "SELECT target_url, " +
                "COUNT(*) AS backlinks_count, " +
                "COUNT(DISTINCT referring_domain) AS ref_domains_count, " +
                "SUM(CASE WHEN follow_type = 'dofollow' OR link_type = 'dofollow' THEN 1 ELSE 0 END) AS dofollow_count " +
                "FROM backlinks " + projClause +
                " GROUP BY target_url " +
                "ORDER BY backlinks_count DESC LIMIT 50";

        return jdbcTemplate.queryForList(sql);
    }

    /**
     * Link Types Breakdown (dofollow, nofollow, sponsored, ugc, redirect)
     */
    @GetMapping("/link-types")
    public Map<String, Object> getLinkTypes(@RequestParam(required = false) Long project_id) {
        authorizationService.requireAuthenticated();

        String projClause = project_id != null ? " WHERE project_id = " + project_id : "";

        String sql = "SELECT COALESCE(follow_type, 'dofollow') AS ftype, COUNT(*) AS cnt " +
                "FROM backlinks " + projClause +
                " GROUP BY COALESCE(follow_type, 'dofollow')";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        Map<String, Object> map = new LinkedHashMap<>();
        int total = 0;
        for (Map<String, Object> r : rows) {
            String ftype = (String) r.get("ftype");
            int c = ((Number) r.get("cnt")).intValue();
            map.put(ftype, c);
            total += c;
        }
        map.put("total", total);
        return map;
    }

    /**
     * Broken Backlinks Management
     */
    @GetMapping("/broken")
    public List<Map<String, Object>> getBrokenBacklinks(@RequestParam(required = false) Long project_id) {
        authorizationService.requireAuthenticated();

        String projClause = project_id != null ? " WHERE (http_status >= 400 OR status = 'broken') AND project_id = " + project_id : " WHERE (http_status >= 400 OR status = 'broken')";

        String sql = "SELECT * FROM backlinks " + projClause + " ORDER BY updated_at DESC LIMIT 100";
        return jdbcTemplate.queryForList(sql);
    }

    /**
     * Backlink Audit & Explainable Toxicity Scoring
     */
    @GetMapping("/audit")
    public List<Map<String, Object>> getAuditLinks(
            @RequestParam(required = false) Long project_id,
            @RequestParam(required = false) String min_risk
    ) {
        authorizationService.requireAuthenticated();

        int riskThreshold = min_risk != null ? Integer.parseInt(min_risk) : 0;
        String sql = "SELECT * FROM backlinks WHERE risk_score >= ? " +
                (project_id != null ? "AND project_id = ? " : "") +
                "ORDER BY risk_score DESC LIMIT 100";

        List<Object> params = new ArrayList<>();
        params.add(riskThreshold);
        if (project_id != null) params.add(project_id);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());

        // Augment with explainable signals
        for (Map<String, Object> r : rows) {
            int score = r.get("risk_score") != null ? ((Number) r.get("risk_score")).intValue() : 10;
            String anchor = (String) r.get("anchor_text");
            String refDomain = (String) r.get("referring_domain");
            int da = r.get("da") != null ? ((Number) r.get("da")).intValue() : 40;

            List<String> reasons = new ArrayList<>();
            if (da < 20) reasons.add("Low domain authority (DA < 20)");
            if (anchor != null && (anchor.toLowerCase().contains("cheap") || anchor.toLowerCase().contains("free") || anchor.toLowerCase().contains("casino"))) {
                reasons.add("Potentially unnatural or commercial anchor phrasing");
            }
            if (refDomain != null && (refDomain.endsWith(".xyz") || refDomain.endsWith(".top") || refDomain.endsWith(".bid"))) {
                reasons.add("Spam-associated TLD extension");
            }
            if (reasons.isEmpty()) {
                reasons.add("Standard low-risk profile");
            }

            r.put("signals", reasons);
            r.put("recommendation", score >= 70 ? "Add to Disavow List" : score >= 40 ? "Review Outreach Removal" : "Keep Monitor");
        }

        return rows;
    }

    /**
     * Disavow Management
     */
    @GetMapping("/disavow")
    public List<Map<String, Object>> getDisavowEntries(@RequestParam(required = false) Long project_id) {
        authorizationService.requireAuthenticated();

        String sql = "SELECT * FROM disavow_entries " +
                (project_id != null ? "WHERE project_id = ? " : "") +
                "ORDER BY created_at DESC";

        return project_id != null ? jdbcTemplate.queryForList(sql, project_id) : jdbcTemplate.queryForList(sql);
    }

    @PostMapping("/disavow")
    public ResponseEntity<?> addDisavow(@RequestBody Map<String, Object> body) {
        authorizationService.requireWrite();
        UserDetailsImpl user = SecurityUtils.getCurrentUser();

        String value = (String) body.get("value");
        String entryType = body.get("entry_type") != null ? ((String) body.get("entry_type")).trim().toLowerCase() : "domain";
        String comment = (String) body.get("comment");
        Long projectId = body.get("project_id") != null ? Long.valueOf(body.get("project_id").toString()) : 1L;

        if (value == null || value.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Domain or URL is required."));
        }

        String cleanVal = value.trim().toLowerCase();
        if ("domain".equals(entryType)) {
            if (cleanVal.startsWith("domain:")) {
                cleanVal = cleanVal.substring(7).trim();
            }
            cleanVal = cleanVal.replaceAll("^https?://", "").replaceAll("^www\\.", "").split("/")[0];
            if (cleanVal.isEmpty() || cleanVal.contains("/") || cleanVal.contains(" ") || !cleanVal.contains(".")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid domain format for disavow entry (e.g. spam-domain.com)."));
            }
        } else if ("url".equals(entryType)) {
            if (!cleanVal.startsWith("http://") && !cleanVal.startsWith("https://")) {
                cleanVal = "https://" + cleanVal;
            }
            try {
                java.net.URI uri = java.net.URI.create(cleanVal);
                if (uri.getHost() == null || !uri.getHost().contains(".")) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid URL format for disavow entry."));
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid URL format for disavow entry."));
            }
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid entry type. Must be 'domain' or 'url'."));
        }

        jdbcTemplate.update(
                "INSERT INTO disavow_entries (project_id, entry_type, value, comment, created_by) VALUES (?, ?, ?, ?, ?)",
                projectId, entryType, cleanVal, comment != null ? comment.trim() : null, user != null ? user.getId() : null
        );

        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System",
                "create", "disavow", cleanVal, "Added to disavow list: " + cleanVal);

        return ResponseEntity.ok(Map.of("message", "Disavow entry added successfully."));
    }

    @DeleteMapping("/disavow/{id}")
    public ResponseEntity<?> removeDisavow(@PathVariable Long id) {
        authorizationService.requireWrite();
        jdbcTemplate.update("DELETE FROM disavow_entries WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("message", "Entry removed from disavow list."));
    }

    @GetMapping("/disavow/export")
    public ResponseEntity<String> exportDisavow(@RequestParam(required = false) Long project_id) {
        authorizationService.requireAuthenticated();

        String sql = "SELECT * FROM disavow_entries " +
                (project_id != null ? "WHERE project_id = ? " : "") +
                "ORDER BY entry_type, value";

        List<Map<String, Object>> rows = project_id != null ? jdbcTemplate.queryForList(sql, project_id) : jdbcTemplate.queryForList(sql);

        StringBuilder sb = new StringBuilder();
        sb.append("# LinkPilot Google Disavow File\n");
        sb.append("# Generated: ").append(new Date()).append("\n");
        sb.append("# Instructions: Upload this file directly to the Google Search Console Disavow Tool.\n\n");

        for (Map<String, Object> r : rows) {
            String comment = (String) r.get("comment");
            if (comment != null && !comment.trim().isEmpty()) {
                sb.append("# ").append(comment.trim()).append("\n");
            }
            String type = (String) r.get("entry_type");
            String val = (String) r.get("value");
            if ("domain".equalsIgnoreCase(type)) {
                sb.append("domain:").append(val).append("\n");
            } else {
                sb.append(val).append("\n");
            }
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"disavow-links.txt\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(sb.toString());
    }
}
