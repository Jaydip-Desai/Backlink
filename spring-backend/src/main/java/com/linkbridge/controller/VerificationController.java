package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import com.linkbridge.service.AuthorizationService;
import com.linkbridge.service.SyncService;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/api/verification")
public class VerificationController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuditService auditService;

    @Autowired
    private SyncService syncService;

    @Autowired
    private AuthorizationService authorizationService;

    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .build();

    private Map<String, Object> checkBacklink(Map<String, Object> backlink, Long userId) {
        String pageUrl = (String) backlink.get("referring_page_url");
        String targetUrl = (String) backlink.get("target_url");
        String anchorText = (String) backlink.get("anchor_text");
        String ref = (String) backlink.get("ref");
        Long backlinkId = ((Number) backlink.get("id")).longValue();
        Long exchangeId = ((Number) backlink.get("exchange_id")).longValue();

        int httpStatus = 0;
        int backlinkFound = 0;
        int targetMatches = 0;
        int anchorMatches = 0;
        int isDofollow = 0;
        String status = "lost";

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(pageUrl))
                    .header("User-Agent", "BacklinkOps-Verifier/1.0 (contact: admin@backlinkops.io)")
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            httpStatus = response.statusCode();

            if (httpStatus >= 200 && httpStatus < 400) {
                Document doc = Jsoup.parse(response.body(), pageUrl);
                Elements links = doc.select("a[href]");

                String normTarget = targetUrl.replaceAll("/+$", "").toLowerCase();
                String normAnchor = anchorText != null ? anchorText.trim().toLowerCase() : null;

                for (Element link : links) {
                    String href = link.absUrl("href").replaceAll("/+$", "").toLowerCase();
                    if (href.equals(normTarget) || href.endsWith(normTarget.replaceFirst("^https?://", ""))) {
                        backlinkFound = 1;
                        targetMatches = 1;
                        String text = link.text().trim().toLowerCase();
                        if (normAnchor != null && text.contains(normAnchor)) {
                            anchorMatches = 1;
                        }
                        String rel = link.attr("rel");
                        if (rel == null || !rel.toLowerCase().contains("nofollow")) {
                            isDofollow = 1;
                        }
                        break;
                    }
                }
                status = backlinkFound == 1 ? "live" : "lost";
            } else {
                status = "lost";
            }
        } catch (Exception e) {
            status = "lost";
            httpStatus = 0;
        }

        if ("live".equals(status)) {
            jdbcTemplate.update(
                    "UPDATE backlinks SET status='live', last_verified_date=CURRENT_DATE::text, first_seen_date=COALESCE(first_seen_date, CURRENT_DATE::text), updated_at=CURRENT_TIMESTAMP WHERE id=?",
                    backlinkId
            );
        } else {
            jdbcTemplate.update(
                    "UPDATE backlinks SET status='lost', last_verified_date=CURRENT_DATE::text, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                    backlinkId
            );
        }

        String note = "live".equals(status) ? "Automated verification: link found and valid." : "Automated verification: link not found on target page.";
        jdbcTemplate.update(
                "INSERT INTO verification_history (backlink_id, checked_at, checked_by, result, http_status, is_dofollow, backlink_found, target_matches, anchor_matches, notes) " +
                "VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?)",
                backlinkId, userId, status, httpStatus > 0 ? httpStatus : null, isDofollow, backlinkFound, targetMatches, anchorMatches, note
        );

        syncService.syncExchangeStatus(exchangeId);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("ref", ref);
        res.put("status", status);
        res.put("httpStatus", httpStatus > 0 ? httpStatus : null);
        res.put("backlinkFound", backlinkFound);
        res.put("targetMatches", targetMatches);
        res.put("anchorMatches", anchorMatches);
        res.put("isDofollow", isDofollow);
        return res;
    }

    @PostMapping("/verify/{ref}")
    public ResponseEntity<?> verify(@PathVariable String ref) {
        String sql = ref.matches("\\d+") ? "SELECT * FROM backlinks WHERE id = ?" : "SELECT * FROM backlinks WHERE ref = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Backlink not found."));
        }
        Map<String, Object> bl = rows.get(0);

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        authorizationService.authorizeBacklinkWrite(user, bl);

        Long userId = user != null ? user.getId() : null;
        String userName = user != null ? user.getUsername() : "System";

        Map<String, Object> result = checkBacklink(bl, userId);
        auditService.logActivity(userId, userName, "verify", "backlink", (String) bl.get("ref"), "Verified " + bl.get("ref") + " → " + ((String) result.get("status")).toUpperCase());

        return ResponseEntity.ok(Map.of("result", result));
    }

    @PostMapping("/verify-bulk")
    public ResponseEntity<?> verifyBulk(@RequestBody Map<String, Object> body) {
        authorizationService.requireWrite();
        List<?> ids = (List<?>) body.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No backlinks selected."));
        }

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        Long userId = user != null ? user.getId() : null;
        String userName = user != null ? user.getUsername() : "System";

        List<Map<String, Object>> results = new ArrayList<>();
        int live = 0, lost = 0;

        for (Object id : ids) {
            Long blId = Long.valueOf(String.valueOf(id));
            List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM backlinks WHERE id = ?", blId);
            if (!rows.isEmpty()) {
                authorizationService.authorizeBacklinkWrite(user, rows.get(0));
                Map<String, Object> r = checkBacklink(rows.get(0), userId);
                if ("live".equals(r.get("status"))) live++;
                else lost++;
                results.add(r);
            }
        }

        auditService.logActivity(userId, userName, "verify", "backlink", null, "Bulk verified " + ids.size() + " backlinks.");

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("results", results);
        res.put("total", results.size());
        res.put("live", live);
        res.put("lost", lost);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/history")
    public Map<String, Object> getHistory(
            @RequestParam(required = false) Long backlink_id,
            @RequestParam(required = false, defaultValue = "50") int limit
    ) {
        authorizationService.requireAuthenticated();
        limit = Math.max(1, Math.min(limit, 100));

        StringBuilder sql = new StringBuilder(
                "SELECT v.*, b.ref AS backlink_ref, b.target_url, b.referring_domain, b.status AS current_status, u.name AS checked_by_name " +
                "FROM verification_history v " +
                "LEFT JOIN backlinks b ON b.id = v.backlink_id " +
                "LEFT JOIN users u ON u.id = v.checked_by WHERE 1=1"
        );
        List<Object> params = new ArrayList<>();
        if (backlink_id != null) {
            sql.append(" AND v.backlink_id = ?");
            params.add(backlink_id);
        }
        sql.append(" ORDER BY v.checked_at DESC LIMIT ?");
        params.add(limit);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        return Map.of("history", rows);
    }

    @GetMapping("/queue")
    public Map<String, Object> getQueue() {
        authorizationService.requireAuthenticated();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT b.*, u.name AS assigned_name FROM backlinks b " +
                "LEFT JOIN users u ON u.id = b.assigned_to " +
                "WHERE b.status IN ('pending','submitted','published','live') " +
                "AND (b.last_verified_date IS NULL OR b.last_verified_date <= (CURRENT_DATE - INTERVAL '7 days')::text) " +
                "ORDER BY b.last_verified_date ASC NULLS FIRST, b.acquisition_date DESC LIMIT 50"
        );
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("queue", rows);
        res.put("total", rows.size());
        return res;
    }

    @GetMapping("/lost")
    public Map<String, Object> getLost(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "25") int limit
    ) {
        authorizationService.requireAuthenticated();
        limit = Math.max(1, Math.min(limit, 100));
        page = Math.max(1, page);

        StringBuilder where = new StringBuilder(" WHERE b.status = 'lost'");
        List<Object> params = new ArrayList<>();

        if (search != null && !search.trim().isEmpty()) {
            String term = "%" + search.trim() + "%";
            where.append(" AND (b.ref ILIKE ? OR b.referring_domain ILIKE ? OR b.anchor_text ILIKE ?)");
            params.add(term);
            params.add(term);
            params.add(term);
        }

        String countSql = "SELECT COUNT(*) FROM backlinks b" + where;
        int total = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());

        String dataSql = "SELECT b.*, u.name AS assigned_name, e.ref AS exchange_ref FROM backlinks b " +
                "LEFT JOIN users u ON u.id = b.assigned_to " +
                "LEFT JOIN exchanges e ON e.id = b.exchange_id" + where +
                " ORDER BY b.last_verified_date DESC NULLS LAST LIMIT ? OFFSET ?";

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

    @PostMapping("/{ref}/restore")
    public ResponseEntity<?> restore(@PathVariable String ref) {
        String sql = ref.matches("\\d+") ? "SELECT * FROM backlinks WHERE id = ?" : "SELECT * FROM backlinks WHERE ref = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ref.matches("\\d+") ? Long.valueOf(ref) : ref);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Backlink not found."));
        }
        Map<String, Object> bl = rows.get(0);
        Long backlinkId = ((Number) bl.get("id")).longValue();
        Long exchangeId = ((Number) bl.get("exchange_id")).longValue();

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        authorizationService.authorizeBacklinkWrite(user, bl);

        Long userId = user != null ? user.getId() : null;
        String userName = user != null ? user.getUsername() : "System";

        jdbcTemplate.update("UPDATE backlinks SET status='live', updated_at=CURRENT_TIMESTAMP WHERE id=?", backlinkId);
        jdbcTemplate.update(
                "INSERT INTO verification_history (backlink_id, checked_at, checked_by, result, notes) VALUES (?, CURRENT_TIMESTAMP, ?, 'live', 'Manually restored.')",
                backlinkId, userId
        );
        syncService.syncExchangeStatus(exchangeId);
        auditService.logActivity(userId, userName, "status_change", "backlink", (String) bl.get("ref"), "Restored backlink " + bl.get("ref"));

        return ResponseEntity.ok(Map.of("message", "Backlink restored to live."));
    }
}
