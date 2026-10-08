package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import com.linkbridge.service.AuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuthorizationService authorizationService;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public List<Map<String, Object>> getProjects() {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return Collections.emptyList();
        }

        // Project isolation: platform admins see all, workspace members see their org/user projects
        String sql;
        List<Object> params = new ArrayList<>();
        String userRole = authorizationService.getUserRole(user);
        if (com.linkbridge.service.AuthorizationService.ROLE_ADMIN.equalsIgnoreCase(userRole)) {
            sql = "SELECT p.*, u.name AS owner_name FROM projects p LEFT JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC";
        } else {
            sql = "SELECT p.*, u.name AS owner_name FROM projects p LEFT JOIN users u ON u.id = p.user_id " +
                  "WHERE (p.user_id = ? OR p.organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = ?)) " +
                  "ORDER BY p.created_at DESC";
            params.add(user.getId());
            params.add(user.getId());
        }

        List<Map<String, Object>> projects = jdbcTemplate.queryForList(sql, params.toArray());

        // Augment each project with quick count statistics
        for (Map<String, Object> proj : projects) {
            Long projId = ((Number) proj.get("id")).longValue();
            Integer totalBacklinks = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM backlinks WHERE project_id = ?", Integer.class, projId);
            Integer refDomains = jdbcTemplate.queryForObject(
                    "SELECT COUNT(DISTINCT referring_domain) FROM backlinks WHERE project_id = ?", Integer.class, projId);
            Integer brokenLinks = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM backlinks WHERE project_id = ? AND (http_status >= 400 OR status = 'broken')", Integer.class, projId);
            Integer highRiskLinks = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM backlinks WHERE project_id = ? AND risk_score >= 60", Integer.class, projId);

            proj.put("total_backlinks", totalBacklinks != null ? totalBacklinks : 0);
            proj.put("referring_domains", refDomains != null ? refDomains : 0);
            proj.put("broken_links", brokenLinks != null ? brokenLinks : 0);
            proj.put("risky_links", highRiskLinks != null ? highRiskLinks : 0);
        }

        return projects;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable Long id) {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required."));
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM projects WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found."));
        }

        Map<String, Object> project = rows.get(0);
        Long ownerId = ((Number) project.get("user_id")).longValue();
        if (!authorizationService.isAdminOrManager(user) && !ownerId.equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied to project."));
        }

        return ResponseEntity.ok(project);
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Map<String, Object> body) {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required."));
        }

        String name = (String) body.get("name");
        String websiteUrl = (String) body.get("website_url");
        String domain = (String) body.get("domain");

        if (name == null || name.trim().length() < 2 || name.trim().length() > 100) {
            return ResponseEntity.badRequest().body(Map.of("error", "Project name must be between 2 and 100 characters."));
        }
        if (websiteUrl == null || websiteUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Website URL is required."));
        }

        String cleanUrl = websiteUrl.trim();
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            cleanUrl = "https://" + cleanUrl;
        }

        try {
            java.net.URI uri = java.net.URI.create(cleanUrl);
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid website URL hostname."));
            }
            if (domain == null || domain.trim().isEmpty()) {
                domain = uri.getHost().toLowerCase();
                if (domain.startsWith("www.")) {
                    domain = domain.substring(4);
                }
            } else {
                domain = domain.trim().toLowerCase().replaceAll("^https?://", "").replaceAll("^www\\.", "").split("/")[0];
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please provide a valid website URL."));
        }

        String description = (String) body.get("description");
        String industry = (String) body.get("industry");
        String country = body.get("country") != null ? (String) body.get("country") : "United States";
        String targetLanguage = body.get("target_language") != null ? (String) body.get("target_language") : "English";

        Number id = jdbcTemplate.queryForObject(
                "INSERT INTO projects (user_id, name, website_url, domain, description, industry, country, target_language) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
                Number.class,
                user.getId(), name.trim(), websiteUrl.trim(), domain.trim().toLowerCase(), description, industry, country, targetLanguage
        );

        auditService.logActivity(user.getId(), user.getUsername(), "create", "project", String.valueOf(id), "Created project: " + name);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Project created successfully.",
                "id", id
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required."));
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM projects WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found."));
        }

        Long ownerId = ((Number) rows.get(0).get("user_id")).longValue();
        if (!authorizationService.isAdminOrManager(user) && !ownerId.equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied."));
        }

        List<String> updates = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        String[] allowedFields = {"name", "website_url", "domain", "description", "industry", "country", "target_language", "timezone", "crawl_settings", "notification_settings"};
        for (String field : allowedFields) {
            if (body.containsKey(field)) {
                updates.add(field + " = ?");
                params.add(body.get(field));
            }
        }

        if (updates.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No fields provided to update."));
        }

        updates.add("updated_at = CURRENT_TIMESTAMP");
        params.add(id);

        jdbcTemplate.update("UPDATE projects SET " + String.join(", ", updates) + " WHERE id = ?", params.toArray());
        auditService.logActivity(user.getId(), user.getUsername(), "update", "project", String.valueOf(id), "Updated project settings");

        return ResponseEntity.ok(Map.of("message", "Project updated successfully."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required."));
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM projects WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found."));
        }

        Long ownerId = ((Number) rows.get(0).get("user_id")).longValue();
        if (!authorizationService.isAdminOrManager(user) && !ownerId.equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied."));
        }

        jdbcTemplate.update("DELETE FROM projects WHERE id = ?", id);
        auditService.logActivity(user.getId(), user.getUsername(), "delete", "project", String.valueOf(id), "Deleted project");

        return ResponseEntity.ok(Map.of("message", "Project deleted successfully."));
    }
}
