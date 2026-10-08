package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import com.linkbridge.service.SequenceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.*;

@RestController
@RequestMapping("/api/domains")
public class DomainController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private SequenceService sequenceService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private com.linkbridge.service.AuthorizationService authorizationService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public static String normalizeDomain(String input) {
        if (input == null) return "";
        String s = input.trim().toLowerCase();
        if (s.startsWith("http://")) s = s.substring(7);
        else if (s.startsWith("https://")) s = s.substring(8);
        int slashIdx = s.indexOf('/');
        if (slashIdx != -1) s = s.substring(0, slashIdx);
        int colonIdx = s.indexOf(':');
        if (colonIdx != -1) s = s.substring(0, colonIdx);
        if (s.startsWith("www.")) s = s.substring(4);
        return s.trim();
    }

    private void formatDomainRows(List<Map<String, Object>> rows) {
        for (Map<String, Object> r : rows) {
            Object tagsObj = r.get("tags");
            if (tagsObj instanceof String) {
                try {
                    r.put("tags", objectMapper.readValue((String) tagsObj, List.class));
                } catch (Exception e) {
                    r.put("tags", Collections.emptyList());
                }
            } else if (tagsObj == null) {
                r.put("tags", Collections.emptyList());
            }
        }
    }

    @GetMapping
    public Map<String, Object> getDomains(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer assigned_to,
            @RequestParam(required = false) String niche,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Integer da_min,
            @RequestParam(required = false) Integer da_max,
            @RequestParam(required = false) Integer dr_min,
            @RequestParam(required = false) Integer dr_max,
            @RequestParam(required = false) Integer traffic_min,
            @RequestParam(required = false) Integer traffic_max,
            @RequestParam(required = false) Integer spam_max,
            @RequestParam(required = false, defaultValue = "created_at") String sort,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "25") int limit
    ) {
        authorizationService.requireAuthenticated();
        limit = Math.min(Math.max(1, limit), 100);
        page = Math.max(1, page);
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (search != null && !search.trim().isEmpty()) {
            String term = "%" + search.trim() + "%";
            where.append(" AND (d.domain ILIKE ? OR d.website_url ILIKE ? OR d.niche ILIKE ?)");
            params.add(term);
            params.add(term);
            params.add(term);
        }
        if (status != null && !status.trim().isEmpty()) {
            where.append(" AND d.status = ?");
            params.add(status);
        }
        if (assigned_to != null) {
            where.append(" AND d.assigned_to = ?");
            params.add(assigned_to);
        }
        if (niche != null && !niche.trim().isEmpty()) {
            where.append(" AND d.niche ILIKE ?");
            params.add("%" + niche.trim() + "%");
        }
        if (country != null && !country.trim().isEmpty()) {
            where.append(" AND d.country = ?");
            params.add(country.trim());
        }
        if (tag != null && !tag.trim().isEmpty()) {
            where.append(" AND d.tags ILIKE ?");
            params.add("%" + tag.trim() + "%");
        }
        if (da_min != null) { where.append(" AND d.da >= ?"); params.add(da_min); }
        if (da_max != null) { where.append(" AND d.da <= ?"); params.add(da_max); }
        if (dr_min != null) { where.append(" AND d.dr >= ?"); params.add(dr_min); }
        if (dr_max != null) { where.append(" AND d.dr <= ?"); params.add(dr_max); }
        if (traffic_min != null) { where.append(" AND d.organic_traffic >= ?"); params.add(traffic_min); }
        if (traffic_max != null) { where.append(" AND d.organic_traffic <= ?"); params.add(traffic_max); }
        if (spam_max != null) { where.append(" AND d.spam_score <= ?"); params.add(spam_max); }

        String countSql = "SELECT COUNT(*) FROM domains d" + where;
        int total = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());

        Set<String> allowedSorts = Set.of("da", "dr", "organic_traffic", "spam_score", "created_at", "updated_at", "domain", "status");
        String sortCol = allowedSorts.contains(sort) ? "d." + sort : "d.created_at";
        String sortOrder = "asc".equalsIgnoreCase(order) ? "ASC" : "DESC";

        String dataSql = "SELECT d.*, u.name AS assigned_name, u.avatar_color FROM domains d " +
                "LEFT JOIN users u ON u.id = d.assigned_to" + where +
                " ORDER BY " + sortCol + " " + sortOrder + " LIMIT ? OFFSET ?";
        
        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(limit);
        dataParams.add((page - 1) * limit);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(dataSql, dataParams.toArray());
        formatDomainRows(rows);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("domains", rows);
        res.put("total", total);
        res.put("page", page);
        res.put("limit", limit);
        res.put("totalPages", (int) Math.ceil((double) total / limit));
        return res;
    }

    @GetMapping("/lookup")
    public ResponseEntity<?> lookup(@RequestParam(required = false) String domain) {
        if (domain == null || domain.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Domain is required."));
        }
        String normalized = normalizeDomain(domain);
        List<Map<String, Object>> domRows = jdbcTemplate.queryForList(
                "SELECT d.*, u.name AS assigned_name FROM domains d LEFT JOIN users u ON u.id = d.assigned_to WHERE d.domain = ?",
                normalized
        );

        if (domRows.isEmpty()) {
            return ResponseEntity.ok(Map.of("exists", false, "normalized", normalized));
        }

        Map<String, Object> domainMap = domRows.get(0);
        formatDomainRows(List.of(domainMap));

        List<Map<String, Object>> exchanges = jdbcTemplate.queryForList(
                "SELECT e.*, u.name AS assigned_name FROM exchanges e LEFT JOIN users u ON u.id = e.assigned_to WHERE e.partner_domain = ? ORDER BY e.exchange_date DESC",
                normalized
        );
        List<Map<String, Object>> backlinks = jdbcTemplate.queryForList(
                "SELECT b.*, u.name AS assigned_name FROM backlinks b LEFT JOIN users u ON u.id = b.assigned_to WHERE b.referring_domain = ?",
                normalized
        );
        List<Map<String, Object>> requests = jdbcTemplate.queryForList(
                "SELECT 'our' AS kind, ref, status, created_at FROM our_requests WHERE partner_domain = ? " +
                "UNION ALL SELECT 'client' AS kind, ref, status, created_at FROM client_requests WHERE client_domain = ? ORDER BY created_at DESC",
                normalized, normalized
        );

        int liveCount = 0, lostCount = 0;
        List<Map<String, Object>> blSimple = new ArrayList<>();
        for (Map<String, Object> b : backlinks) {
            String st = (String) b.get("status");
            if ("live".equalsIgnoreCase(st)) liveCount++;
            if ("lost".equalsIgnoreCase(st)) lostCount++;
            blSimple.add(Map.of("ref", b.get("ref"), "side", b.get("side"), "status", b.get("status")));
        }

        Map<String, Object> history = new LinkedHashMap<>();
        history.put("totalExchanges", exchanges.size());
        history.put("liveBacklinks", liveCount);
        history.put("lostBacklinks", lostCount);
        history.put("exchanges", exchanges);
        history.put("backlinks", blSimple);
        history.put("requests", requests);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("exists", true);
        res.put("normalized", normalized);
        res.put("domain", domainMap);
        res.put("history", history);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        int total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM domains", Integer.class);
        List<Map<String, Object>> byStatus = jdbcTemplate.queryForList("SELECT status, COUNT(*) AS n FROM domains GROUP BY status");
        List<Map<String, Object>> topDa = jdbcTemplate.queryForList("SELECT ref, domain, da, dr, organic_traffic FROM domains ORDER BY da DESC NULLS LAST LIMIT 10");
        List<Map<String, Object>> countries = jdbcTemplate.queryForList("SELECT country, COUNT(*) AS n FROM domains WHERE country IS NOT NULL GROUP BY country ORDER BY n DESC");
        List<Map<String, Object>> niches = jdbcTemplate.queryForList("SELECT niche, COUNT(*) AS n FROM domains WHERE niche IS NOT NULL GROUP BY niche ORDER BY n DESC");

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("total", total);
        res.put("byStatus", byStatus);
        res.put("topDa", topDa);
        res.put("countries", countries);
        res.put("niches", niches);
        return res;
    }

    @GetMapping("/{ref}")
    public ResponseEntity<?> getDomainByRef(@PathVariable String ref) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT d.*, u.name AS assigned_name, au.name AS added_by_name FROM domains d " +
                "LEFT JOIN users u ON u.id = d.assigned_to " +
                "LEFT JOIN users au ON au.id = d.added_by WHERE d.ref = ?",
                ref
        );
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Domain not found."));
        }
        Map<String, Object> domain = rows.get(0);
        formatDomainRows(List.of(domain));
        Long domainId = ((Number) domain.get("id")).longValue();
        String domainName = (String) domain.get("domain");

        List<Map<String, Object>> contacts = jdbcTemplate.queryForList("SELECT * FROM contacts WHERE domain_id = ? ORDER BY created_at DESC", domainId);
        List<Map<String, Object>> ourReqs = jdbcTemplate.queryForList("SELECT * FROM our_requests WHERE domain_id = ? ORDER BY request_date DESC", domainId);
        List<Map<String, Object>> clientReqs = jdbcTemplate.queryForList("SELECT * FROM client_requests WHERE domain_id = ? ORDER BY request_date DESC", domainId);
        List<Map<String, Object>> exchanges = jdbcTemplate.queryForList(
                "SELECT e.*, u.name AS assigned_name FROM exchanges e LEFT JOIN users u ON u.id = e.assigned_to WHERE e.partner_domain = ? ORDER BY e.exchange_date DESC",
                domainName
        );
        List<Map<String, Object>> backlinks = jdbcTemplate.queryForList(
                "SELECT b.*, u.name AS assigned_name FROM backlinks b LEFT JOIN users u ON u.id = b.assigned_to WHERE b.referring_domain = ? ORDER BY b.created_at DESC",
                domainName
        );
        List<Map<String, Object>> verHistory = jdbcTemplate.queryForList(
                "SELECT v.*, u.name AS checked_by_name FROM verification_history v " +
                "LEFT JOIN users u ON u.id = v.checked_by " +
                "WHERE v.backlink_id IN (SELECT id FROM backlinks WHERE referring_domain = ?) ORDER BY v.checked_at DESC",
                domainName
        );
        List<Map<String, Object>> activity = jdbcTemplate.queryForList(
                "SELECT a.*, u.avatar_color FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id WHERE a.entity_ref = ? ORDER BY a.created_at DESC",
                ref
        );

        int completedCount = 0, liveCount = 0, lostCount = 0;
        for (Map<String, Object> e : exchanges) {
            if ("completed".equalsIgnoreCase((String) e.get("status"))) completedCount++;
        }
        for (Map<String, Object> b : backlinks) {
            if ("live".equalsIgnoreCase((String) b.get("status"))) liveCount++;
            if ("lost".equalsIgnoreCase((String) b.get("status"))) lostCount++;
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalExchanges", exchanges.size());
        stats.put("completedExchanges", completedCount);
        stats.put("liveBacklinks", liveCount);
        stats.put("lostBacklinks", lostCount);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("domain", domain);
        res.put("contacts", contacts);
        res.put("ourRequests", ourReqs);
        res.put("clientRequests", clientReqs);
        res.put("exchanges", exchanges);
        res.put("backlinks", backlinks);
        res.put("verificationHistory", verHistory);
        res.put("activity", activity);
        res.put("stats", stats);
        return ResponseEntity.ok(res);
    }

    @PostMapping
    public ResponseEntity<?> createDomain(@RequestBody Map<String, Object> body) {
        authorizationService.requireWrite();
        String websiteUrl = (String) body.get("website_url");
        if (websiteUrl == null || websiteUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Website URL is required."));
        }
        String domain = normalizeDomain(websiteUrl);
        if (domain.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid domain name."));
        }

        String ref = sequenceService.nextRef("DOM", "domain");
        String niche = (String) body.get("niche");
        String country = (String) body.get("country");
        String language = (String) body.get("language");
        Integer da = body.get("da") != null ? Integer.valueOf(String.valueOf(body.get("da"))) : null;
        Integer dr = body.get("dr") != null ? Integer.valueOf(String.valueOf(body.get("dr"))) : null;
        Integer traffic = body.get("organic_traffic") != null ? Integer.valueOf(String.valueOf(body.get("organic_traffic"))) : null;
        Integer spam = body.get("spam_score") != null ? Integer.valueOf(String.valueOf(body.get("spam_score"))) : null;
        String status = body.get("status") != null ? (String) body.get("status") : "new";
        String notes = (String) body.get("internal_notes");

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        Long userId = user != null ? user.getId() : null;
        String userName = user != null ? user.getUsername() : "System";

        jdbcTemplate.update(
                "INSERT INTO domains (ref, domain, website_url, niche, country, language, da, dr, organic_traffic, spam_score, status, internal_notes, added_by, tags, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                ref, domain, websiteUrl, niche, country, language, da, dr, traffic, spam, status, notes, userId
        );

        auditService.logActivity(userId, userName, "create", "domain", ref, "Added domain " + domain);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Domain added successfully",
                "ref", ref
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDomain(@PathVariable String id, @RequestBody Map<String, Object> body) {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        Long userId = user != null ? user.getId() : null;
        String userName = user != null ? user.getUsername() : "System";

        // id could be numeric or ref
        String sql = id.matches("\\d+") ? "SELECT * FROM domains WHERE id = ?" : "SELECT * FROM domains WHERE ref = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, id.matches("\\d+") ? Long.valueOf(id) : id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Domain not found."));
        }
        Map<String, Object> row = rows.get(0);
        authorizationService.authorizeDomainWrite(user, row);
        Long domainId = ((Number) row.get("id")).longValue();

        List<String> updates = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        String[] fields = {"website_url", "niche", "country", "language", "da", "dr", "organic_traffic", "spam_score", "status", "internal_notes", "assigned_to"};
        for (String f : fields) {
            if (body.containsKey(f)) {
                // Non-admins cannot reassign to other users unless manager/admin
                if ("assigned_to".equals(f) && !authorizationService.isAdminOrManager(user)) {
                    continue;
                }
                updates.add(f + " = ?");
                params.add(body.get(f));
            }
        }
        if (updates.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No fields to update."));
        }

        updates.add("updated_at = CURRENT_TIMESTAMP");
        params.add(domainId);

        jdbcTemplate.update("UPDATE domains SET " + String.join(", ", updates) + " WHERE id = ?", params.toArray());
        auditService.logActivity(userId, userName, "update", "domain", (String) row.get("ref"), "Updated domain " + row.get("domain"));
        return ResponseEntity.ok(Map.of("message", "Domain updated."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDomain(@PathVariable String id) {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        String sql = id.matches("\\d+") ? "SELECT * FROM domains WHERE id = ?" : "SELECT * FROM domains WHERE ref = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, id.matches("\\d+") ? Long.valueOf(id) : id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Domain not found."));
        }
        Map<String, Object> row = rows.get(0);
        authorizationService.authorizeDomainWrite(user, row);
        Long domainId = ((Number) row.get("id")).longValue();
        jdbcTemplate.update("UPDATE domains SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?", domainId);
        return ResponseEntity.ok(Map.of("message", "Domain deleted."));
    }
}
