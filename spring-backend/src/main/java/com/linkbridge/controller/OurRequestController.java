package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import com.linkbridge.service.SequenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/our-requests")
public class OurRequestController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private SequenceService sequenceService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private com.linkbridge.service.AuthorizationService authorizationService;

    @GetMapping
    public Map<String, Object> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Integer assigned_to,
            @RequestParam(required = false) Integer domain_id,
            @RequestParam(required = false) String tag,
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
            where.append(" AND (o.ref ILIKE ? OR o.partner_domain ILIKE ? OR o.target_url ILIKE ? OR o.anchor_text ILIKE ?)");
            params.add(term);
            params.add(term);
            params.add(term);
            params.add(term);
        }
        if (status != null && !status.trim().isEmpty()) {
            where.append(" AND o.status = ?");
            params.add(status);
        }
        if (priority != null && !priority.trim().isEmpty()) {
            where.append(" AND o.priority = ?");
            params.add(priority);
        }
        if (assigned_to != null) {
            where.append(" AND o.assigned_to = ?");
            params.add(assigned_to);
        }
        if (domain_id != null) {
            where.append(" AND o.domain_id = ?");
            params.add(domain_id);
        }
        if (tag != null && !tag.trim().isEmpty()) {
            where.append(" AND o.tags ILIKE ?");
            params.add("%" + tag.trim() + "%");
        }

        String countSql = "SELECT COUNT(*) FROM our_requests o" + where;
        int total = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());

        Set<String> allowedSorts = Set.of("status", "priority", "request_date", "created_at", "partner_domain");
        String sortCol = allowedSorts.contains(sort) ? "o." + sort : "o.created_at";
        String sortOrder = "asc".equalsIgnoreCase(order) ? "ASC" : "DESC";

        String dataSql = "SELECT o.*, u.name AS assigned_name, u.avatar_color FROM our_requests o " +
                "LEFT JOIN users u ON u.id = o.assigned_to" + where +
                " ORDER BY " + sortCol + " " + sortOrder + " LIMIT ? OFFSET ?";

        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(limit);
        dataParams.add((page - 1) * limit);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(dataSql, dataParams.toArray());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("requests", rows);
        res.put("total", total);
        res.put("page", page);
        res.put("limit", limit);
        res.put("totalPages", (int) Math.ceil((double) total / limit));
        return res;
    }

    @GetMapping("/{ref}")
    public ResponseEntity<?> getOne(@PathVariable String ref) {
        String sql = ref.matches("\\d+") ?
                "SELECT o.*, u.name AS assigned_name, d.domain AS domain_name FROM our_requests o " +
                "LEFT JOIN users u ON u.id=o.assigned_to LEFT JOIN domains d ON d.id=o.domain_id WHERE o.id = ?" :
                "SELECT o.*, u.name AS assigned_name, d.domain AS domain_name FROM our_requests o " +
                "LEFT JOIN users u ON u.id=o.assigned_to LEFT JOIN domains d ON d.id=o.domain_id WHERE o.ref = ?";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Request not found."));
        }
        Map<String, Object> row = rows.get(0);
        Long id = ((Number) row.get("id")).longValue();

        List<Map<String, Object>> exchanges = jdbcTemplate.queryForList(
                "SELECT e.*, u.name AS assigned_name FROM exchanges e LEFT JOIN users u ON u.id=e.assigned_to WHERE e.our_request_id = ? ORDER BY e.exchange_date DESC",
                id
        );
        List<Map<String, Object>> backlinks = jdbcTemplate.queryForList(
                "SELECT b.*, u.name AS assigned_name FROM backlinks b LEFT JOIN users u ON u.id=b.assigned_to WHERE b.exchange_id IN (SELECT id FROM exchanges WHERE our_request_id = ?) AND b.side='our'",
                id
        );

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("request", row);
        res.put("exchanges", exchanges);
        res.put("backlinks", backlinks);
        return ResponseEntity.ok(res);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        authorizationService.requireWrite();
        String ourWebsite = (String) body.get("our_website");
        String partnerDomain = (String) body.get("partner_domain");
        String targetUrl = (String) body.get("target_url");
        String requestDate = (String) body.get("request_date");

        if (ourWebsite == null || ourWebsite.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Our website is required."));
        }
        if (partnerDomain == null || partnerDomain.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Partner domain is required."));
        }
        if (targetUrl == null || targetUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Target URL is required."));
        }
        if (requestDate == null || requestDate.trim().isEmpty()) {
            requestDate = new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date());
        }

        String ref = sequenceService.nextRef("OUR", "our_request");
        String partnerPage = (String) body.get("partner_page");
        String anchorText = (String) body.get("anchor_text");
        String linkType = body.get("link_type") != null ? (String) body.get("link_type") : "dofollow";
        String placementType = body.get("placement_type") != null ? (String) body.get("placement_type") : "content";
        String priority = body.get("priority") != null ? (String) body.get("priority") : "medium";
        String status = body.get("status") != null ? (String) body.get("status") : "draft";
        String notes = (String) body.get("notes");
        Integer domainId = body.get("domain_id") != null ? Integer.valueOf(String.valueOf(body.get("domain_id"))) : null;
        Integer assignedTo = body.get("assigned_to") != null ? Integer.valueOf(String.valueOf(body.get("assigned_to"))) : null;

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        Long userId = user != null ? user.getId() : null;
        String userName = user != null ? user.getUsername() : "System";

        if (user != null && !authorizationService.isAdminOrManager(user) && assignedTo != null && !assignedTo.equals(user.getId().intValue())) {
            throw new org.springframework.security.access.AccessDeniedException("Executives cannot assign requests to other users.");
        }

        jdbcTemplate.update(
                "INSERT INTO our_requests (ref, our_website, partner_domain, partner_page, target_url, anchor_text, link_type, placement_type, request_date, assigned_to, priority, status, domain_id, notes, created_by, created_at, updated_at, tags) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]')",
                ref, ourWebsite, partnerDomain, partnerPage, targetUrl, anchorText, linkType, placementType, requestDate, assignedTo, priority, status, domainId, notes, userId
        );

        auditService.logActivity(userId, userName, "create", "our_request", ref, "Created our request for " + partnerDomain);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Our Request created.",
                "ref", ref
        ));
    }

    @PutMapping("/{ref}")
    public ResponseEntity<?> update(@PathVariable String ref, @RequestBody Map<String, Object> body) {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        String sql = ref.matches("\\d+") ? "SELECT * FROM our_requests WHERE id = ?" : "SELECT * FROM our_requests WHERE ref = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Request not found."));
        }
        Map<String, Object> row = rows.get(0);
        authorizationService.authorizeOurRequestWrite(user, row);

        if (user != null && !authorizationService.isAdminOrManager(user) && body.containsKey("assigned_to")) {
            Object newAssigned = body.get("assigned_to");
            if (newAssigned != null && !newAssigned.toString().equals(String.valueOf(user.getId()))) {
                throw new org.springframework.security.access.AccessDeniedException("Executives cannot reassign requests to other users.");
            }
        }

        Long id = ((Number) row.get("id")).longValue();

        List<String> updates = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        String[] fields = {"our_website", "partner_domain", "partner_page", "target_url", "anchor_text", "link_type", "placement_type", "request_date", "assigned_to", "priority", "status", "domain_id", "notes"};
        for (String f : fields) {
            if (body.containsKey(f)) {
                updates.add(f + " = ?");
                params.add(body.get(f));
            }
        }
        if (updates.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No fields to update."));
        }

        updates.add("updated_at = CURRENT_TIMESTAMP");
        params.add(id);

        jdbcTemplate.update("UPDATE our_requests SET " + String.join(", ", updates) + " WHERE id = ?", params.toArray());

        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System", "update", "our_request", (String) row.get("ref"), "Updated our request " + row.get("ref"));

        return ResponseEntity.ok(Map.of("message", "Request updated."));
    }

    @DeleteMapping("/{ref}")
    public ResponseEntity<?> delete(@PathVariable String ref) {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        String sql = ref.matches("\\d+") ? "SELECT * FROM our_requests WHERE id = ?" : "SELECT * FROM our_requests WHERE ref = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Request not found."));
        }
        Map<String, Object> row = rows.get(0);
        authorizationService.authorizeOurRequestWrite(user, row);
        Long id = ((Number) row.get("id")).longValue();
        jdbcTemplate.update("UPDATE our_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("message", "Request cancelled."));
    }
}
