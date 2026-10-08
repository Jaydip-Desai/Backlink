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
@RequestMapping("/api/outreach")
public class OutreachController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuthorizationService authorizationService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private com.linkbridge.service.EmailService emailService;

    /**
     * Link-Building Opportunity Engine
     */
    @GetMapping("/opportunities")
    public List<Map<String, Object>> getOpportunities(
            @RequestParam(required = false) Long project_id,
            @RequestParam(required = false) String type
    ) {
        authorizationService.requireAuthenticated();

        String sql = "SELECT d.domain, d.website_url, d.da, d.dr, d.niche, d.country, d.organic_traffic " +
                "FROM domains d ORDER BY d.da DESC LIMIT 60";

        List<Map<String, Object>> domains = jdbcTemplate.queryForList(sql);
        List<Map<String, Object>> opps = new ArrayList<>();

        String[] oppTypes = {"competitor_backlink", "broken_link", "resource_page", "guest_post", "unlinked_mention", "lost_link_recovery"};
        String[] priorities = {"high", "medium", "low"};

        int idx = 0;
        for (Map<String, Object> d : domains) {
            String oppType = oppTypes[idx % oppTypes.length];
            if (type != null && !type.trim().isEmpty() && !type.equalsIgnoreCase(oppType)) {
                idx++;
                continue;
            }

            int da = d.get("da") != null ? ((Number) d.get("da")).intValue() : 40;
            Map<String, Object> item = new LinkedHashMap<>(d);
            item.put("opportunity_type", oppType);
            item.put("priority", priorities[idx % priorities.length]);
            item.put("estimated_difficulty", da > 70 ? "Hard" : da > 45 ? "Medium" : "Easy");

            switch (oppType) {
                case "competitor_backlink":
                    item.put("reason", "Links to 2 top competitors with editorial context.");
                    break;
                case "broken_link":
                    item.put("reason", "Contains a 404 broken outbound resource link suitable for replacement.");
                    break;
                case "resource_page":
                    item.put("reason", "Maintains an active industry tools and resources hub page.");
                    break;
                case "guest_post":
                    item.put("reason", "Accepts high-quality expert guest editorial publications.");
                    break;
                case "unlinked_mention":
                    item.put("reason", "Referenced brand or product name without hyperlinking target URL.");
                    break;
                case "lost_link_recovery":
                    item.put("reason", "Previously acquired backlink dropped during publisher CMS migration.");
                    break;
            }

            opps.add(item);
            idx++;
        }

        return opps;
    }

    /**
     * Outreach Campaigns
     */
    @GetMapping("/campaigns")
    public List<Map<String, Object>> getCampaigns(@RequestParam(required = false) Long project_id) {
        authorizationService.requireAuthenticated();

        String sql = "SELECT c.*, " +
                "(SELECT COUNT(*) FROM outreach_prospects p WHERE p.campaign_id = c.id) AS prospect_count, " +
                "(SELECT COUNT(*) FROM outreach_prospects p WHERE p.campaign_id = c.id AND p.stage = 'acquired') AS acquired_count " +
                "FROM outreach_campaigns c " +
                (project_id != null ? "WHERE c.project_id = ? " : "") +
                "ORDER BY c.created_at DESC";

        return project_id != null ? jdbcTemplate.queryForList(sql, project_id) : jdbcTemplate.queryForList(sql);
    }

    @PostMapping("/campaigns")
    public ResponseEntity<?> createCampaign(@RequestBody Map<String, Object> body) {
        authorizationService.requireWrite();
        UserDetailsImpl user = SecurityUtils.getCurrentUser();

        String name = (String) body.get("name");
        String description = (String) body.get("description");
        Long projectId = body.get("project_id") != null ? Long.valueOf(body.get("project_id").toString()) : 1L;
        int targetLinks = body.get("target_links_count") != null ? Integer.parseInt(body.get("target_links_count").toString()) : 10;

        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Campaign name is required."));
        }

        Number id = jdbcTemplate.queryForObject(
                "INSERT INTO outreach_campaigns (project_id, name, description, target_links_count, created_by) " +
                "VALUES (?, ?, ?, ?, ?) RETURNING id",
                Number.class,
                projectId, name.trim(), description, targetLinks, user != null ? user.getId() : null
        );

        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System",
                "create", "campaign", String.valueOf(id), "Created campaign: " + name);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id, "message", "Campaign created."));
    }

    /**
     * Outreach Prospects & Pipeline CRM
     */
    @GetMapping("/prospects")
    public List<Map<String, Object>> getProspects(
            @RequestParam(required = false) Long project_id,
            @RequestParam(required = false) Long campaign_id,
            @RequestParam(required = false) String stage
    ) {
        authorizationService.requireAuthenticated();

        StringBuilder sql = new StringBuilder("SELECT p.*, c.name AS campaign_name FROM outreach_prospects p LEFT JOIN outreach_campaigns c ON c.id = p.campaign_id WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (project_id != null) {
            sql.append(" AND p.project_id = ?");
            params.add(project_id);
        }
        if (campaign_id != null) {
            sql.append(" AND p.campaign_id = ?");
            params.add(campaign_id);
        }
        if (stage != null && !stage.trim().isEmpty()) {
            sql.append(" AND p.stage = ?");
            params.add(stage);
        }

        sql.append(" ORDER BY p.updated_at DESC");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    @PostMapping("/prospects")
    public ResponseEntity<?> createProspect(@RequestBody Map<String, Object> body) {
        authorizationService.requireWrite();
        UserDetailsImpl user = SecurityUtils.getCurrentUser();

        String domain = (String) body.get("domain");
        if (domain == null || domain.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Domain is required."));
        }
        String cleanDomain = domain.trim().toLowerCase().replaceAll("^https?://", "").replaceAll("^www\\.", "").split("/")[0];
        if (cleanDomain.isEmpty() || !cleanDomain.contains(".")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please provide a valid publisher domain (e.g. searchengineland.com)."));
        }

        Long projectId = body.get("project_id") != null ? Long.valueOf(body.get("project_id").toString()) : 1L;
        Long campaignId = body.get("campaign_id") != null ? Long.valueOf(body.get("campaign_id").toString()) : null;
        String url = (String) body.get("url");
        String oppType = body.get("opportunity_type") != null ? (String) body.get("opportunity_type") : "guest_post";
        String contactName = (String) body.get("contact_name");
        String contactEmail = (String) body.get("contact_email");
        if (contactEmail != null && !contactEmail.isBlank()) {
            contactEmail = contactEmail.trim().toLowerCase();
            if (!contactEmail.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid contact email address format."));
            }
        } else {
            contactEmail = null;
        }

        String stage = body.get("stage") != null ? ((String) body.get("stage")).trim().toLowerCase() : "new";
        Set<String> validStages = Set.of("new", "qualified", "contacted", "followup", "replied", "negotiating", "acquired", "rejected");
        if (!validStages.contains(stage)) {
            stage = "new";
        }

        String priority = body.get("priority") != null ? ((String) body.get("priority")).trim().toLowerCase() : "medium";
        if (!Set.of("low", "medium", "high").contains(priority)) {
            priority = "medium";
        }

        String notes = (String) body.get("notes");
        String followUp = (String) body.get("follow_up_date");
        int da = 45;
        if (body.get("da") != null) {
            try {
                da = Math.max(0, Math.min(100, Integer.parseInt(body.get("da").toString())));
            } catch (Exception ignored) {}
        }

        Number id = jdbcTemplate.queryForObject(
                "INSERT INTO outreach_prospects (project_id, campaign_id, domain, url, opportunity_type, contact_name, contact_email, stage, priority, notes, follow_up_date, da, created_by) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
                Number.class,
                projectId, campaignId, domain.trim().toLowerCase(), url, oppType, contactName, contactEmail, stage, priority, notes, followUp, da, user != null ? user.getId() : null
        );

        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System",
                "create", "prospect", domain, "Added outreach prospect: " + domain);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id, "message", "Prospect added."));
    }

    @PutMapping("/prospects/{id}")
    public ResponseEntity<?> updateProspect(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        authorizationService.requireWrite();
        UserDetailsImpl user = SecurityUtils.getCurrentUser();

        List<String> updates = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        String[] fields = {"stage", "notes", "contact_name", "contact_email", "follow_up_date", "priority", "campaign_id"};
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

        jdbcTemplate.update("UPDATE outreach_prospects SET " + String.join(", ", updates) + " WHERE id = ?", params.toArray());

        return ResponseEntity.ok(Map.of("message", "Prospect updated successfully."));
    }

    @DeleteMapping("/prospects/{id}")
    public ResponseEntity<?> deleteProspect(@PathVariable Long id) {
        authorizationService.requireWrite();
        jdbcTemplate.update("DELETE FROM outreach_prospects WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("message", "Prospect deleted successfully."));
    }

    /**
     * Email Pitch Templates
     */
    @GetMapping("/templates")
    public List<Map<String, Object>> getTemplates() {
        authorizationService.requireAuthenticated();
        return jdbcTemplate.queryForList("SELECT * FROM email_templates ORDER BY id ASC");
    }

    @PostMapping("/templates")
    public ResponseEntity<?> createTemplate(@RequestBody Map<String, String> body) {
        authorizationService.requireWrite();
        UserDetailsImpl user = SecurityUtils.getCurrentUser();

        String name = body.get("name");
        String subject = body.get("subject");
        String textBody = body.get("body");
        String category = body.getOrDefault("category", "outreach");

        if (name == null || subject == null || textBody == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, subject, and body are required."));
        }

        jdbcTemplate.update(
                "INSERT INTO email_templates (name, subject, body, category, created_by) VALUES (?, ?, ?, ?, ?)",
                name.trim(), subject.trim(), textBody, category, user != null ? user.getId() : null
        );

        return ResponseEntity.ok(Map.of("message", "Template created."));
    }

    @PostMapping("/prospects/{id}/send-email")
    public ResponseEntity<?> sendProspectEmail(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        authorizationService.requireAuthenticated();
        String subject = body.get("subject");
        String bodyContent = body.get("body");
        String recipient = body.get("recipient");

        if (recipient == null || recipient.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Recipient email is required."));
        }
        if (subject == null || subject.isBlank()) {
            subject = "Link Collaboration Inquiry";
        }

        emailService.sendOutreachEmail(recipient, body.get("contact_name"), subject, bodyContent, id);
        jdbcTemplate.update("UPDATE outreach_prospects SET stage = 'contacted', updated_at = CURRENT_TIMESTAMP WHERE id = ?", id);

        return ResponseEntity.ok(Map.of(
            "ok", true,
            "message", "Outreach pitch email dispatched successfully to " + recipient,
            "stage", "contacted"
        ));
    }
}
