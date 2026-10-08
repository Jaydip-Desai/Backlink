package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import com.linkbridge.service.AuthorizationService;
import com.linkbridge.service.SequenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/client-requests")
public class ClientRequestController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private SequenceService sequenceService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuthorizationService authorizationService;

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
        limit = Math.max(1, Math.min(limit, 100));
        page = Math.max(1, page);

        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (search != null && !search.trim().isEmpty()) {
            String term = "%" + search.trim() + "%";
            where.append(" AND (c.ref ILIKE ? OR c.client_domain ILIKE ? OR c.client_target_url ILIKE ? OR c.anchor_text ILIKE ?)");
            params.add(term);
            params.add(term);
            params.add(term);
            params.add(term);
        }
        if (status != null && !status.trim().isEmpty()) {
            where.append(" AND c.status = ?");
            params.add(status);
        }
        if (priority != null && !priority.trim().isEmpty()) {
            where.append(" AND c.priority = ?");
            params.add(priority);
        }
        if (assigned_to != null) {
            where.append(" AND c.assigned_to = ?");
            params.add(assigned_to);
        }
        if (domain_id != null) {
            where.append(" AND c.domain_id = ?");
            params.add(domain_id);
        }
        if (tag != null && !tag.trim().isEmpty()) {
            where.append(" AND c.tags ILIKE ?");
            params.add("%" + tag.trim() + "%");
        }

        String countSql = "SELECT COUNT(*) FROM client_requests c" + where;
        int total = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());

        Set<String> allowedSorts = Set.of("status", "priority", "request_date", "created_at", "client_domain");
        String sortCol = allowedSorts.contains(sort) ? "c." + sort : "c.created_at";
        String sortOrder = "asc".equalsIgnoreCase(order) ? "ASC" : "DESC";

        String dataSql = "SELECT c.*, u.name AS assigned_name, u.avatar_color FROM client_requests c " +
                "LEFT JOIN users u ON u.id = c.assigned_to" + where +
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
        authorizationService.requireAuthenticated();
        String sql = ref.matches("\\d+") ?
                "SELECT c.*, u.name AS assigned_name, d.domain AS domain_name FROM client_requests c " +
                "LEFT JOIN users u ON u.id=c.assigned_to LEFT JOIN domains d ON d.id=c.domain_id WHERE c.id = ?" :
                "SELECT c.*, u.name AS assigned_name, d.domain AS domain_name FROM client_requests c " +
                "LEFT JOIN users u ON u.id=c.assigned_to LEFT JOIN domains d ON d.id=c.domain_id WHERE c.ref = ?";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Client request not found."));
        }
        Map<String, Object> row = rows.get(0);
        Long id = ((Number) row.get("id")).longValue();

        List<Map<String, Object>> exchanges = jdbcTemplate.queryForList(
                "SELECT e.*, u.name AS assigned_name FROM exchanges e LEFT JOIN users u ON u.id=e.assigned_to WHERE e.client_request_id = ? ORDER BY e.exchange_date DESC",
                id
        );
        List<Map<String, Object>> backlinks = jdbcTemplate.queryForList(
                "SELECT b.*, u.name AS assigned_name FROM backlinks b LEFT JOIN users u ON u.id=b.assigned_to WHERE b.exchange_id IN (SELECT id FROM exchanges WHERE client_request_id = ?) AND b.side='client'",
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
        String clientDomain = (String) body.get("client_domain");
        String ourWebsite = (String) body.get("our_website");
        String clientTargetUrl = (String) body.get("client_target_url");
        String requestDate = (String) body.get("request_date");

        if (clientDomain == null || clientDomain.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Client domain is required."));
        }
        if (ourWebsite == null || ourWebsite.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Our website is required."));
        }
        if (clientTargetUrl == null || clientTargetUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Client target URL is required."));
        }
        if (requestDate == null || requestDate.trim().isEmpty()) {
            requestDate = new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date());
        }

        String ref = sequenceService.nextRef("CLI", "client_request");
        String ourPage = (String) body.get("our_page");
        String anchorText = (String) body.get("anchor_text");
        String linkType = body.get("link_type") != null ? (String) body.get("link_type") : "dofollow";
        String placementType = body.get("placement_type") != null ? (String) body.get("placement_type") : "content";
        String priority = body.get("priority") != null ? (String) body.get("priority") : "medium";
        String status = body.get("status") != null ? (String) body.get("status") : "available";
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
                "INSERT INTO client_requests (ref, client_domain, our_website, our_page, client_target_url, anchor_text, link_type, placement_type, request_date, assigned_to, priority, status, domain_id, notes, created_by, created_at, updated_at, tags) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]')",
                ref, clientDomain, ourWebsite, ourPage, clientTargetUrl, anchorText, linkType, placementType, requestDate, assignedTo, priority, status, domainId, notes, userId
        );

        auditService.logActivity(userId, userName, "create", "client_request", ref, "Created client request from " + clientDomain);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Client Request created.",
                "ref", ref
        ));
    }

    @PutMapping("/{ref}")
    public ResponseEntity<?> update(@PathVariable String ref, @RequestBody Map<String, Object> body) {
        String sql = ref.matches("\\d+") ? "SELECT * FROM client_requests WHERE id = ?" : "SELECT * FROM client_requests WHERE ref = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Client request not found."));
        }
        Map<String, Object> row = rows.get(0);
        Long id = ((Number) row.get("id")).longValue();

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        authorizationService.authorizeClientRequestWrite(user, row);

        if (user != null && !authorizationService.isAdminOrManager(user) && body.containsKey("assigned_to")) {
            Object newAssigned = body.get("assigned_to");
            if (newAssigned != null && !newAssigned.toString().equals(String.valueOf(user.getId()))) {
                throw new org.springframework.security.access.AccessDeniedException("Executives cannot reassign requests to other users.");
            }
        }

        List<String> updates = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        String[] fields = {"client_domain", "our_website", "our_page", "client_target_url", "anchor_text", "link_type", "placement_type", "request_date", "assigned_to", "priority", "status", "domain_id", "notes"};
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

        jdbcTemplate.update("UPDATE client_requests SET " + String.join(", ", updates) + " WHERE id = ?", params.toArray());

        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System", "update", "client_request", (String) row.get("ref"), "Updated client request " + row.get("ref"));

        return ResponseEntity.ok(Map.of("message", "Client request updated."));
    }

    @DeleteMapping("/{ref}")
    public ResponseEntity<?> delete(@PathVariable String ref) {
        String sql = ref.matches("\\d+") ? "SELECT * FROM client_requests WHERE id = ?" : "SELECT * FROM client_requests WHERE ref = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Client request not found."));
        }
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        authorizationService.authorizeClientRequestWrite(user, rows.get(0));

        Long id = ((Number) rows.get(0).get("id")).longValue();
        jdbcTemplate.update("UPDATE client_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("message", "Client request cancelled."));
    }
}
