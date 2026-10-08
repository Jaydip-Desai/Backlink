package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import com.linkbridge.service.SequenceService;
import com.linkbridge.service.SyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/exchanges")
public class ExchangeController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private SequenceService sequenceService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private SyncService syncService;

    @Autowired
    private com.linkbridge.service.AuthorizationService authorizationService;

    @GetMapping
    public Map<String, Object> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String partner_domain,
            @RequestParam(required = false) Integer assigned_to,
            @RequestParam(required = false) String balance,
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
            where.append(" AND (e.ref ILIKE ? OR e.partner_domain ILIKE ? OR e.notes ILIKE ?)");
            params.add(term);
            params.add(term);
            params.add(term);
        }
        if (status != null && !status.trim().isEmpty()) {
            where.append(" AND e.status = ?");
            params.add(status);
        }
        if (partner_domain != null && !partner_domain.trim().isEmpty()) {
            where.append(" AND e.partner_domain ILIKE ?");
            params.add("%" + partner_domain.trim() + "%");
        }
        if (assigned_to != null) {
            where.append(" AND e.assigned_to = ?");
            params.add(assigned_to);
        }

        String countSql = "SELECT COUNT(*) FROM exchanges e" + where;
        int total = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());

        Set<String> allowedSorts = Set.of("status", "priority", "exchange_date", "created_at", "partner_domain");
        String sortCol = allowedSorts.contains(sort) ? "e." + sort : "e.created_at";
        String sortOrder = "asc".equalsIgnoreCase(order) ? "ASC" : "DESC";

        String dataSql = "SELECT e.*, u.name AS assigned_name, u.avatar_color, ou.ref AS our_request_ref, cr.ref AS client_request_ref " +
                "FROM exchanges e " +
                "LEFT JOIN users u ON u.id = e.assigned_to " +
                "LEFT JOIN our_requests ou ON ou.id = e.our_request_id " +
                "LEFT JOIN client_requests cr ON cr.id = e.client_request_id" + where +
                " ORDER BY " + sortCol + " " + sortOrder + " LIMIT ? OFFSET ?";

        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(limit);
        dataParams.add((page - 1) * limit);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(dataSql, dataParams.toArray());
        for (Map<String, Object> r : rows) {
            Long exId = ((Number) r.get("id")).longValue();
            r.put("balance", syncService.getExchangeBalance(exId).get("balance"));
        }

        if (balance != null && !balance.trim().isEmpty()) {
            rows.removeIf(r -> !balance.equalsIgnoreCase((String) r.get("balance")));
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("exchanges", rows);
        res.put("total", total);
        res.put("page", page);
        res.put("limit", limit);
        res.put("totalPages", (int) Math.ceil((double) total / limit));
        return res;
    }

    @GetMapping("/{ref}")
    public ResponseEntity<?> getOne(@PathVariable String ref) {
        String sql = ref.matches("\\d+") ?
                "SELECT e.*, u.name AS assigned_name, ou.name AS our_assigned_name, cr.name AS client_assigned_name, au.name AS created_by_name " +
                "FROM exchanges e " +
                "LEFT JOIN users u ON u.id=e.assigned_to " +
                "LEFT JOIN our_requests o ON o.id=e.our_request_id " +
                "LEFT JOIN client_requests c ON c.id=e.client_request_id " +
                "LEFT JOIN users ou ON ou.id=o.assigned_to " +
                "LEFT JOIN users cr ON cr.id=c.assigned_to " +
                "LEFT JOIN users au ON au.id=e.created_by WHERE e.id = ?" :
                "SELECT e.*, u.name AS assigned_name, ou.name AS our_assigned_name, cr.name AS client_assigned_name, au.name AS created_by_name " +
                "FROM exchanges e " +
                "LEFT JOIN users u ON u.id=e.assigned_to " +
                "LEFT JOIN our_requests o ON o.id=e.our_request_id " +
                "LEFT JOIN client_requests c ON c.id=e.client_request_id " +
                "LEFT JOIN users ou ON ou.id=o.assigned_to " +
                "LEFT JOIN users cr ON cr.id=c.assigned_to " +
                "LEFT JOIN users au ON au.id=e.created_by WHERE e.ref = ?";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Exchange not found."));
        }
        Map<String, Object> row = rows.get(0);
        Long id = ((Number) row.get("id")).longValue();
        Object ourReqId = row.get("our_request_id");
        Object clientReqId = row.get("client_request_id");

        Map<String, Object> ourReq = null;
        if (ourReqId != null) {
            List<Map<String, Object>> orList = jdbcTemplate.queryForList(
                    "SELECT o.*, u.name AS assigned_name FROM our_requests o LEFT JOIN users u ON u.id=o.assigned_to WHERE o.id = ?", ourReqId
            );
            if (!orList.isEmpty()) ourReq = orList.get(0);
        }

        Map<String, Object> clientReq = null;
        if (clientReqId != null) {
            List<Map<String, Object>> crList = jdbcTemplate.queryForList(
                    "SELECT c.*, u.name AS assigned_name FROM client_requests c LEFT JOIN users u ON u.id=c.assigned_to WHERE c.id = ?", clientReqId
            );
            if (!crList.isEmpty()) clientReq = crList.get(0);
        }

        List<Map<String, Object>> backlinks = jdbcTemplate.queryForList(
                "SELECT b.*, u.name AS assigned_name FROM backlinks b LEFT JOIN users u ON u.id=b.assigned_to WHERE b.exchange_id = ? ORDER BY b.side", id
        );

        Map<String, Object> bal = syncService.getExchangeBalance(id);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("exchange", row);
        res.put("ourRequest", ourReq);
        res.put("clientRequest", clientReq);
        res.put("backlinks", backlinks);
        res.put("balance", bal.get("balance"));
        res.put("ourState", bal.get("ourState"));
        res.put("clientState", bal.get("clientState"));
        return ResponseEntity.ok(res);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        authorizationService.requireWrite();
        Object ourReqId = body.get("our_request_id");
        Object clientReqId = body.get("client_request_id");
        String partnerDomain = (String) body.get("partner_domain");
        String exchangeDate = (String) body.get("exchange_date");

        if (ourReqId == null || clientReqId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Our Request and Client Request are required."));
        }
        if (partnerDomain == null || partnerDomain.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Partner domain is required."));
        }
        if (exchangeDate == null || exchangeDate.trim().isEmpty()) {
            exchangeDate = new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date());
        }

        Long ourId = Long.valueOf(String.valueOf(ourReqId));
        Long cliId = Long.valueOf(String.valueOf(clientReqId));

        List<Map<String, Object>> dup = jdbcTemplate.queryForList(
                "SELECT id FROM exchanges WHERE our_request_id = ? AND client_request_id = ?", ourId, cliId
        );
        if (!dup.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "These requests are already matched in an exchange."));
        }

        String ref = sequenceService.nextRef("EX", "exchange");
        String type = body.get("exchange_type") != null ? (String) body.get("exchange_type") : "link_exchange";
        String priority = body.get("priority") != null ? (String) body.get("priority") : "medium";
        String status = body.get("status") != null ? (String) body.get("status") : "pending";
        String notes = (String) body.get("notes");
        Integer assignedTo = body.get("assigned_to") != null ? Integer.valueOf(String.valueOf(body.get("assigned_to"))) : null;

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        Long userId = user != null ? user.getId() : null;
        String userName = user != null ? user.getUsername() : "System";

        jdbcTemplate.update(
                "INSERT INTO exchanges (ref, our_request_id, client_request_id, partner_domain, exchange_type, exchange_date, assigned_to, priority, status, notes, created_by, created_at, updated_at, tags) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[\"Link Exchange\"]')",
                ref, ourId, cliId, partnerDomain, type, exchangeDate, assignedTo, priority, status, notes, userId
        );

        jdbcTemplate.update("UPDATE our_requests SET status='exchanged', updated_at=CURRENT_TIMESTAMP WHERE id=?", ourId);
        jdbcTemplate.update("UPDATE client_requests SET status='exchanged', updated_at=CURRENT_TIMESTAMP WHERE id=?", cliId);

        auditService.logActivity(userId, userName, "match", "exchange", ref, "Matched exchange " + ref);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Exchange created.",
                "ref", ref
        ));
    }

    @PutMapping("/{ref}")
    public ResponseEntity<?> update(@PathVariable String ref, @RequestBody Map<String, Object> body) {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        String sql = ref.matches("\\d+") ? "SELECT * FROM exchanges WHERE id = ?" : "SELECT * FROM exchanges WHERE ref = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Exchange not found."));
        }
        Map<String, Object> row = rows.get(0);
        authorizationService.authorizeExchangeWrite(user, row);
        Long id = ((Number) row.get("id")).longValue();

        List<String> updates = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        String[] fields = {"partner_domain", "exchange_type", "exchange_date", "assigned_to", "priority", "status", "notes"};
        for (String f : fields) {
            if (body.containsKey(f)) {
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
        params.add(id);

        jdbcTemplate.update("UPDATE exchanges SET " + String.join(", ", updates) + " WHERE id = ?", params.toArray());
        syncService.syncExchangeStatus(id);

        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System", "update", "exchange", (String) row.get("ref"), "Updated exchange " + row.get("ref"));

        return ResponseEntity.ok(Map.of("message", "Exchange updated."));
    }

    @PostMapping("/{ref}/resync")
    public ResponseEntity<?> resync(@PathVariable String ref) {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        String sql = ref.matches("\\d+") ? "SELECT * FROM exchanges WHERE id = ?" : "SELECT * FROM exchanges WHERE ref = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Exchange not found."));
        }
        authorizationService.authorizeExchangeWrite(user, rows.get(0));
        Long id = ((Number) rows.get(0).get("id")).longValue();
        syncService.syncExchangeStatus(id);
        return ResponseEntity.ok(Map.of("message", "Exchange status re-synced."));
    }
}
