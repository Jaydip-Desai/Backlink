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
@RequestMapping("/api/contacts")
public class ContactController {

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
            @RequestParam(required = false) Integer domain_id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "25") int limit
    ) {
        authorizationService.requireAuthenticated();
        limit = Math.max(1, Math.min(limit, 100));
        page = Math.max(1, page);

        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (domain_id != null) {
            where.append(" AND c.domain_id = ?");
            params.add(domain_id);
        }
        if (status != null && !status.trim().isEmpty()) {
            where.append(" AND c.status = ?");
            params.add(status);
        }
        if (search != null && !search.trim().isEmpty()) {
            String term = "%" + search.trim() + "%";
            where.append(" AND (c.name ILIKE ? OR c.email ILIKE ? OR c.company ILIKE ?)");
            params.add(term);
            params.add(term);
            params.add(term);
        }

        String countSql = "SELECT COUNT(*) FROM contacts c" + where;
        int total = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());

        String dataSql = "SELECT c.*, d.domain AS domain_name FROM contacts c " +
                "LEFT JOIN domains d ON d.id = c.domain_id" + where +
                " ORDER BY c.created_at DESC LIMIT ? OFFSET ?";

        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(limit);
        dataParams.add((page - 1) * limit);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(dataSql, dataParams.toArray());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("contacts", rows);
        res.put("total", total);
        res.put("page", page);
        res.put("limit", limit);
        res.put("totalPages", (int) Math.ceil((double) total / limit));
        return res;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Long id) {
        authorizationService.requireAuthenticated();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT c.*, d.domain AS domain_name FROM contacts c LEFT JOIN domains d ON d.id = c.domain_id WHERE c.id = ?", id
        );
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Contact not found."));
        }
        return ResponseEntity.ok(Map.of("contact", rows.get(0)));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        authorizationService.requireWrite();
        Object domId = body.get("domain_id");
        String name = (String) body.get("name");
        if (domId == null || name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Domain ID and name are required."));
        }

        Long domainId = Long.valueOf(String.valueOf(domId));
        List<Map<String, Object>> dom = jdbcTemplate.queryForList("SELECT id FROM domains WHERE id = ?", domainId);
        if (dom.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Domain not found."));
        }

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        authorizationService.authorizeContactWrite(user, Map.of("domain_id", domainId));

        String ref = sequenceService.nextRef("CT", "contact");
        String designation = (String) body.get("designation");
        String company = (String) body.get("company");
        String email = (String) body.get("email");
        String linkedin = (String) body.get("linkedin");
        String phone = (String) body.get("phone");
        String source = (String) body.get("source");
        String notes = (String) body.get("notes");
        String status = body.get("status") != null ? (String) body.get("status") : "new";

        Long userId = user != null ? user.getId() : null;
        String userName = user != null ? user.getUsername() : "System";

        jdbcTemplate.update(
                "INSERT INTO contacts (ref, domain_id, name, designation, company, email, linkedin, phone, source, notes, status, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                ref, domainId, name, designation, company, email, linkedin, phone, source, notes, status
        );

        auditService.logActivity(userId, userName, "create", "contact", ref, "Added contact " + name);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Contact added.",
                "ref", ref
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM contacts WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Contact not found."));
        }
        Map<String, Object> row = rows.get(0);

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        authorizationService.authorizeContactWrite(user, row);

        List<String> updates = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        String[] fields = {"name", "designation", "company", "email", "linkedin", "phone", "source", "notes", "status", "first_contact_at", "last_contact_at", "next_follow_up_at"};
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

        jdbcTemplate.update("UPDATE contacts SET " + String.join(", ", updates) + " WHERE id = ?", params.toArray());

        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System", "update", "contact", (String) row.get("ref"), "Updated contact " + row.get("name"));

        return ResponseEntity.ok(Map.of("message", "Contact updated."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM contacts WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Contact not found."));
        }
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        authorizationService.authorizeContactWrite(user, rows.get(0));

        jdbcTemplate.update("DELETE FROM contacts WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("message", "Contact deleted."));
    }
}
