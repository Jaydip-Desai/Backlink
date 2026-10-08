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
@RequestMapping({"/api/followups", "/api/follow-ups"})
public class FollowUpController {

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
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer assigned_to,
            @RequestParam(required = false) String kind,
            @RequestParam(required = false) Integer domain_id,
            @RequestParam(required = false) String due_from,
            @RequestParam(required = false) String due_to,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "50") int limit
    ) {
        authorizationService.requireAuthenticated();
        limit = Math.max(1, Math.min(limit, 100));
        page = Math.max(1, page);

        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (status != null && !status.trim().isEmpty()) {
            where.append(" AND f.status = ?");
            params.add(status);
        }
        if (assigned_to != null) {
            where.append(" AND f.assigned_to = ?");
            params.add(assigned_to);
        }
        if (kind != null && !kind.trim().isEmpty()) {
            where.append(" AND f.kind = ?");
            params.add(kind);
        }
        if (domain_id != null) {
            where.append(" AND f.domain_id = ?");
            params.add(domain_id);
        }
        if (due_from != null && !due_from.trim().isEmpty()) {
            where.append(" AND f.due_date >= ?");
            params.add(due_from);
        }
        if (due_to != null && !due_to.trim().isEmpty()) {
            where.append(" AND f.due_date <= ?");
            params.add(due_to);
        }

        String countSql = "SELECT COUNT(*) FROM follow_ups f" + where;
        int total = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());

        String dataSql = "SELECT f.*, d.domain AS domain_name, u.name AS assigned_name, u.avatar_color FROM follow_ups f " +
                "LEFT JOIN domains d ON d.id = f.domain_id " +
                "LEFT JOIN users u ON u.id = f.assigned_to" + where +
                " ORDER BY f.due_date ASC LIMIT ? OFFSET ?";

        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(limit);
        dataParams.add((page - 1) * limit);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(dataSql, dataParams.toArray());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("followUps", rows);
        res.put("total", total);
        res.put("page", page);
        res.put("limit", limit);
        res.put("totalPages", (int) Math.ceil((double) total / limit));
        return res;
    }

    @GetMapping("/due-today")
    public Map<String, Object> getDueToday() {
        authorizationService.requireAuthenticated();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT f.*, d.domain AS domain_name, u.name AS assigned_name FROM follow_ups f " +
                "LEFT JOIN domains d ON d.id = f.domain_id " +
                "LEFT JOIN users u ON u.id = f.assigned_to " +
                "WHERE f.status IN ('open','in_progress') AND f.due_date <= CURRENT_DATE::text ORDER BY f.due_date ASC"
        );
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("followUps", rows);
        res.put("total", rows.size());
        return res;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        authorizationService.requireWrite();
        String dueDate = (String) body.get("due_date");
        if (dueDate == null || dueDate.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Due date is required."));
        }

        String ref = sequenceService.nextRef("FG", "follow_up");
        Integer domainId = body.get("domain_id") != null ? Integer.valueOf(String.valueOf(body.get("domain_id"))) : null;
        Integer contactId = body.get("contact_id") != null ? Integer.valueOf(String.valueOf(body.get("contact_id"))) : null;
        Integer ourReqId = body.get("our_request_id") != null ? Integer.valueOf(String.valueOf(body.get("our_request_id"))) : null;
        Integer cliReqId = body.get("client_request_id") != null ? Integer.valueOf(String.valueOf(body.get("client_request_id"))) : null;
        Integer exId = body.get("exchange_id") != null ? Integer.valueOf(String.valueOf(body.get("exchange_id"))) : null;
        Integer assignedTo = body.get("assigned_to") != null ? Integer.valueOf(String.valueOf(body.get("assigned_to"))) : null;
        String status = body.get("status") != null ? (String) body.get("status") : "open";
        String kind = body.get("kind") != null ? (String) body.get("kind") : "contact";
        String notes = (String) body.get("notes");

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        Long userId = user != null ? user.getId() : null;
        String userName = user != null ? user.getUsername() : "System";

        if (user != null && !authorizationService.isAdminOrManager(user) && assignedTo != null && !assignedTo.equals(user.getId().intValue())) {
            throw new org.springframework.security.access.AccessDeniedException("Executives cannot assign follow-ups to other users.");
        }

        jdbcTemplate.update(
                "INSERT INTO follow_ups (ref, domain_id, contact_id, our_request_id, client_request_id, exchange_id, due_date, assigned_to, status, kind, notes, created_by, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                ref, domainId, contactId, ourReqId, cliReqId, exId, dueDate, assignedTo, status, kind, notes, userId
        );

        auditService.logActivity(userId, userName, "create", "follow_up", ref, "Scheduled follow-up due " + dueDate);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Follow-up scheduled.",
                "ref", ref
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM follow_ups WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Follow-up not found."));
        }
        Map<String, Object> row = rows.get(0);

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        authorizationService.authorizeFollowUpWrite(user, row);

        if (user != null && !authorizationService.isAdminOrManager(user) && body.containsKey("assigned_to")) {
            Object newAssigned = body.get("assigned_to");
            if (newAssigned != null && !newAssigned.toString().equals(String.valueOf(user.getId()))) {
                throw new org.springframework.security.access.AccessDeniedException("Executives cannot reassign follow-ups to other users.");
            }
        }

        List<String> updates = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        String[] fields = {"due_date", "assigned_to", "status", "kind", "notes", "completed_at"};
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

        jdbcTemplate.update("UPDATE follow_ups SET " + String.join(", ", updates) + " WHERE id = ?", params.toArray());
        return ResponseEntity.ok(Map.of("message", "Follow-up updated."));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM follow_ups WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Follow-up not found."));
        }
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        authorizationService.authorizeFollowUpWrite(user, rows.get(0));

        jdbcTemplate.update("UPDATE follow_ups SET status = 'completed', completed_at = CURRENT_DATE::text, updated_at = CURRENT_TIMESTAMP WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("message", "Follow-up completed."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM follow_ups WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Follow-up not found."));
        }
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        authorizationService.authorizeFollowUpWrite(user, rows.get(0));

        jdbcTemplate.update("DELETE FROM follow_ups WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("message", "Follow-up deleted."));
    }
}
