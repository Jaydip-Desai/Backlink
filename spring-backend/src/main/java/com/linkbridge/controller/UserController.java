package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    @Autowired
    private com.linkbridge.service.AuthorizationService authorizationService;

    @GetMapping
    public Map<String, Object> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        authorizationService.requireRole("admin");
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (role != null && !role.trim().isEmpty()) {
            where.append(" AND role = ?");
            params.add(role);
        }
        if (status != null && !status.trim().isEmpty()) {
            where.append(" AND status = ?");
            params.add(status);
        }
        if (search != null && !search.trim().isEmpty()) {
            String term = "%" + search.trim() + "%";
            where.append(" AND (name ILIKE ? OR email ILIKE ?)");
            params.add(term);
            params.add(term);
        }

        String sql = "SELECT id, name, email, role, status, title, avatar_color, created_at, last_login_at FROM users" + where + " ORDER BY created_at DESC";
        List<Map<String, Object>> users = jdbcTemplate.queryForList(sql, params.toArray());
        return Map.of("users", users, "total", users.size());
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body) {
        authorizationService.requireRole("admin");
        String name = (String) body.get("name");
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String role = body.get("role") != null ? (String) body.get("role") : "executive";
        String title = (String) body.get("title");

        if (name == null || name.trim().isEmpty() || email == null || !email.contains("@") || password == null || password.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Valid name, email, and password (>= 8 chars) are required."));
        }

        Integer dup = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email.toLowerCase().trim());
        if (dup != null && dup > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "A user with that email already exists."));
        }

        String[] colors = {"#6366f1","#f59e0b","#10b981","#ec4899","#06b6d4","#8b5cf6"};
        String color = colors[new Random().nextInt(colors.length)];

        jdbcTemplate.update(
                "INSERT INTO users (name, email, password_hash, role, status, title, avatar_color, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, 'active', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                name.trim(), email.toLowerCase().trim(), passwordEncoder.encode(password), role, title, color
        );

        Long newId = jdbcTemplate.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email.toLowerCase().trim());

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System", "create", "user", String.valueOf(newId), "Created user " + name);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", newId, "message", "User created."));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        authorizationService.requireRole("admin");
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM users WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found."));
        }

        List<String> updates = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        String[] fields = {"name", "role", "status", "title"};
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

        jdbcTemplate.update("UPDATE users SET " + String.join(", ", updates) + " WHERE id = ?", params.toArray());

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System", "update", "user", String.valueOf(id), "Updated user " + rows.get(0).get("name"));

        return ResponseEntity.ok(Map.of("message", "User updated."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        authorizationService.requireRole("admin");
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        if (user != null && user.getId().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot delete your own account."));
        }
        jdbcTemplate.update("UPDATE users SET status = 'disabled', updated_at = CURRENT_TIMESTAMP WHERE id = ?", id);
        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System", "delete", "user", String.valueOf(id), "Disabled user " + id);
        return ResponseEntity.ok(Map.of("message", "User account disabled."));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id) {
        authorizationService.requireRole("admin");
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM users WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found."));
        }
        String token = UUID.randomUUID().toString().replace("-", "") + System.currentTimeMillis();
        jdbcTemplate.update("UPDATE users SET reset_token = ?, reset_expires_at = CURRENT_TIMESTAMP + INTERVAL '1 hour', updated_at = CURRENT_TIMESTAMP WHERE id = ?", token, id);

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System", "password_reset", "user", String.valueOf(id), "Generated reset for " + rows.get(0).get("name"));

        return ResponseEntity.ok(Map.of("message", "Password reset token generated.", "resetToken", token));
    }
}
