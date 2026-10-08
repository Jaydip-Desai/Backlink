package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import com.linkbridge.service.AuthorizationService;
import com.linkbridge.service.SequenceService;
import com.linkbridge.service.SyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/backlinks")
public class BacklinkController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private SequenceService sequenceService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private SyncService syncService;

    @Autowired
    private AuthorizationService authorizationService;

    @GetMapping
    public Map<String, Object> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String side,
            @RequestParam(required = false) Integer exchange_id,
            @RequestParam(required = false) String referring_domain,
            @RequestParam(required = false) String target_url,
            @RequestParam(required = false) String link_type,
            @RequestParam(required = false) String anchor,
            @RequestParam(required = false) Integer assigned_to,
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
            where.append(" AND (b.ref ILIKE ? OR b.referring_domain ILIKE ? OR b.target_url ILIKE ? OR b.anchor_text ILIKE ? OR b.referring_page_url ILIKE ?)");
            params.add(term);
            params.add(term);
            params.add(term);
            params.add(term);
            params.add(term);
        }
        if (status != null && !status.trim().isEmpty()) {
            where.append(" AND b.status = ?");
            params.add(status);
        }
        if (side != null && !side.trim().isEmpty()) {
            where.append(" AND b.side = ?");
            params.add(side);
        }
        if (exchange_id != null) {
            where.append(" AND b.exchange_id = ?");
            params.add(exchange_id);
        }
        if (referring_domain != null && !referring_domain.trim().isEmpty()) {
            where.append(" AND b.referring_domain ILIKE ?");
            params.add("%" + referring_domain.trim() + "%");
        }
        if (target_url != null && !target_url.trim().isEmpty()) {
            where.append(" AND b.target_url ILIKE ?");
            params.add("%" + target_url.trim() + "%");
        }
        if (link_type != null && !link_type.trim().isEmpty()) {
            where.append(" AND b.link_type = ?");
            params.add(link_type);
        }
        if (anchor != null && !anchor.trim().isEmpty()) {
            where.append(" AND b.anchor_text ILIKE ?");
            params.add("%" + anchor.trim() + "%");
        }
        if (assigned_to != null) {
            where.append(" AND b.assigned_to = ?");
            params.add(assigned_to);
        }

        String countSql = "SELECT COUNT(*) FROM backlinks b" + where;
        int total = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());

        Set<String> allowedSorts = Set.of("status", "side", "acquisition_date", "created_at", "referring_domain");
        String sortCol = allowedSorts.contains(sort) ? "b." + sort : "b.created_at";
        String sortOrder = "asc".equalsIgnoreCase(order) ? "ASC" : "DESC";

        String dataSql = "SELECT b.*, u.name AS assigned_name, u.avatar_color FROM backlinks b " +
                "LEFT JOIN users u ON u.id = b.assigned_to" + where +
                " ORDER BY " + sortCol + " " + sortOrder + " LIMIT ? OFFSET ?";

        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(limit);
        dataParams.add((page - 1) * limit);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(dataSql, dataParams.toArray());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("backlinks", rows);
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
                "SELECT b.*, u.name AS assigned_name, e.ref AS exchange_ref FROM backlinks b " +
                "LEFT JOIN users u ON u.id=b.assigned_to LEFT JOIN exchanges e ON e.id=b.exchange_id WHERE b.id = ?" :
                "SELECT b.*, u.name AS assigned_name, e.ref AS exchange_ref FROM backlinks b " +
                "LEFT JOIN users u ON u.id=b.assigned_to LEFT JOIN exchanges e ON e.id=b.exchange_id WHERE b.ref = ?";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Backlink not found."));
        }
        Map<String, Object> row = rows.get(0);
        Long id = ((Number) row.get("id")).longValue();

        List<Map<String, Object>> history = jdbcTemplate.queryForList(
                "SELECT v.*, u.name AS checked_by_name FROM verification_history v " +
                "LEFT JOIN users u ON u.id=v.checked_by WHERE v.backlink_id = ? ORDER BY v.checked_at DESC", id
        );

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("backlink", row);
        res.put("verificationHistory", history);
        return ResponseEntity.ok(res);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        authorizationService.requireWrite();
        Object exchangeIdObj = body.get("exchange_id");
        String side = (String) body.get("side");
        String referringDomain = (String) body.get("referring_domain");
        String referringPageUrl = (String) body.get("referring_page_url");
        String targetUrl = (String) body.get("target_url");
        String acquisitionDate = (String) body.get("acquisition_date");

        if (exchangeIdObj == null || referringDomain == null || referringPageUrl == null || targetUrl == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Exchange ID, referring domain, page URL, and target URL are required."));
        }

        Long exchangeId = Long.valueOf(String.valueOf(exchangeIdObj));
        List<Map<String, Object>> ex = jdbcTemplate.queryForList("SELECT id FROM exchanges WHERE id = ?", exchangeId);
        if (ex.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Exchange not found."));
        }

        String ref = sequenceService.nextRef("BL", "backlink");
        String anchorText = (String) body.get("anchor_text");
        String linkType = body.get("link_type") != null ? (String) body.get("link_type") : "dofollow";
        String placementType = body.get("placement_type") != null ? (String) body.get("placement_type") : "content";
        String status = body.get("status") != null ? (String) body.get("status") : "pending";
        String notes = (String) body.get("notes");
        Integer assignedTo = body.get("assigned_to") != null ? Integer.valueOf(String.valueOf(body.get("assigned_to"))) : null;

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        Long userId = user != null ? user.getId() : null;
        String userName = user != null ? user.getUsername() : "System";

        if (user != null && !authorizationService.isAdminOrManager(user) && assignedTo != null && !assignedTo.equals(user.getId().intValue())) {
            throw new org.springframework.security.access.AccessDeniedException("Executives cannot assign backlinks to other users.");
        }

        jdbcTemplate.update(
                "INSERT INTO backlinks (ref, exchange_id, side, referring_domain, referring_page_url, target_url, anchor_text, link_type, placement_type, acquisition_date, first_seen_date, status, assigned_to, notes, created_by, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                ref, exchangeId, side != null ? side : "our", referringDomain, referringPageUrl, targetUrl, anchorText, linkType, placementType, acquisitionDate != null ? acquisitionDate : new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date()), acquisitionDate, status, assignedTo, notes, userId
        );

        syncService.syncExchangeStatus(exchangeId);
        auditService.logActivity(userId, userName, "create", "backlink", ref, "Created backlink for exchange " + exchangeId + " (" + side + ")");

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Backlink added.",
                "ref", ref
        ));
    }

    @PutMapping("/{ref}")
    public ResponseEntity<?> update(@PathVariable String ref, @RequestBody Map<String, Object> body) {
        String sql = ref.matches("\\d+") ? "SELECT * FROM backlinks WHERE id = ?" : "SELECT * FROM backlinks WHERE ref = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Backlink not found."));
        }
        Map<String, Object> row = rows.get(0);
        Long id = ((Number) row.get("id")).longValue();
        Long exchangeId = ((Number) row.get("exchange_id")).longValue();

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        authorizationService.authorizeBacklinkWrite(user, row);

        if (user != null && !authorizationService.isAdminOrManager(user) && body.containsKey("assigned_to")) {
            Object newAssigned = body.get("assigned_to");
            if (newAssigned != null && !newAssigned.toString().equals(String.valueOf(user.getId()))) {
                throw new org.springframework.security.access.AccessDeniedException("Executives cannot reassign backlinks to other users.");
            }
        }

        List<String> updates = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        String[] fields = {"side", "referring_domain", "referring_page_url", "target_url", "anchor_text", "link_type", "placement_type", "acquisition_date", "status", "assigned_to", "notes"};
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

        jdbcTemplate.update("UPDATE backlinks SET " + String.join(", ", updates) + " WHERE id = ?", params.toArray());
        syncService.syncExchangeStatus(exchangeId);

        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System", "update", "backlink", (String) row.get("ref"), "Updated backlink " + row.get("ref"));

        return ResponseEntity.ok(Map.of("message", "Backlink updated."));
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> bulkUpdate(@RequestBody Map<String, Object> body) {
        authorizationService.requireWrite();
        List<?> ids = (List<?>) body.get("ids");
        String action = (String) body.get("action");
        Object value = body.get("value");

        if (ids == null || ids.isEmpty() || action == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No records selected or invalid action."));
        }
        if (!Set.of("status", "assigned_to").contains(action)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unsupported bulk action."));
        }

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        if ("assigned_to".equals(action) && !authorizationService.isAdminOrManager(user)) {
            throw new org.springframework.security.access.AccessDeniedException("Only admins and managers can bulk reassign backlinks.");
        }

        for (Object id : ids) {
            Long blId = Long.valueOf(String.valueOf(id));
            List<Map<String, Object>> blRows = jdbcTemplate.queryForList("SELECT * FROM backlinks WHERE id = ?", blId);
            if (!blRows.isEmpty()) {
                authorizationService.authorizeBacklinkWrite(user, blRows.get(0));
                jdbcTemplate.update("UPDATE backlinks SET " + action + " = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", value, blId);
            }
        }

        return ResponseEntity.ok(Map.of("message", "Bulk update completed."));
    }
}
