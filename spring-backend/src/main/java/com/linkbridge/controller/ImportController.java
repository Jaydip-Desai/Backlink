package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import com.linkbridge.service.AuthorizationService;
import com.linkbridge.service.SequenceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/import")
public class ImportController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private SequenceService sequenceService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuthorizationService authorizationService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/preview")
    public ResponseEntity<?> preview(
            @RequestParam(value = "type", defaultValue = "domains") String type,
            @RequestParam("file") MultipartFile file
    ) {
        authorizationService.requireRole("admin", "manager");
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded."));
        }

        try {
            List<Map<String, String>> rows = new ArrayList<>();
            List<String> headers = new ArrayList<>();
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.csv";

            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
                    Sheet sheet = workbook.getSheetAt(0);
                    Row headerRow = sheet.getRow(0);
                    if (headerRow != null) {
                        for (Cell c : headerRow) {
                            headers.add(c.getStringCellValue().trim().toLowerCase().replaceAll("[^a-z0-9_]", "_"));
                        }
                        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                            Row r = sheet.getRow(i);
                            if (r == null) continue;
                            Map<String, String> row = new LinkedHashMap<>();
                            for (int j = 0; j < headers.size(); j++) {
                                Cell cell = r.getCell(j);
                                row.put(headers.get(j), cell != null ? cell.toString().trim() : "");
                            }
                            rows.add(row);
                        }
                    }
                }
            } else {
                try (CSVParser parser = new CSVParser(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8), CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {
                    headers = new ArrayList<>(parser.getHeaderNames());
                    for (CSVRecord record : parser) {
                        Map<String, String> row = new LinkedHashMap<>();
                        for (String h : headers) {
                            row.put(h.trim().toLowerCase().replaceAll("[^a-z0-9_]", "_"), record.get(h).trim());
                        }
                        rows.add(row);
                    }
                }
            }

            Set<String> existingDomains = new HashSet<>(jdbcTemplate.queryForList("SELECT domain FROM domains", String.class));
            int valid = 0, duplicates = 0, invalid = 0;
            List<Map<String, String>> validRows = new ArrayList<>();
            List<Map<String, Object>> errors = new ArrayList<>();

            for (int i = 0; i < rows.size(); i++) {
                Map<String, String> r = rows.get(i);
                String domainVal = r.get("domain");
                if (domainVal == null || domainVal.isEmpty()) domainVal = r.get("website_url");
                if (domainVal == null || domainVal.isEmpty()) {
                    invalid++;
                    errors.add(Map.of("row", i + 2, "error", "Domain is required."));
                    continue;
                }
                String norm = DomainController.normalizeDomain(domainVal);
                if (existingDomains.contains(norm)) {
                    duplicates++;
                    continue;
                }
                valid++;
                r.put("domain", norm);
                validRows.add(r);
            }

            UserDetailsImpl user = SecurityUtils.getCurrentUser();
            Long userId = user != null ? user.getId() : null;

            String errReport = errors.isEmpty() ? null : objectMapper.writeValueAsString(errors);
            jdbcTemplate.update(
                    "INSERT INTO import_jobs (type, filename, status, total_rows, valid_rows, duplicate_rows, invalid_rows, error_report, created_by, created_at) " +
                    "VALUES (?, ?, 'preview', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                    type, filename, rows.size(), valid, duplicates, invalid, errReport, userId
            );
            Long jobId = jdbcTemplate.queryForObject("SELECT MAX(id) FROM import_jobs", Long.class);

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("jobId", jobId);
            res.put("totalRows", rows.size());
            res.put("validRows", valid);
            res.put("duplicates", duplicates);
            res.put("invalid", invalid);
            res.put("errors", errors);
            res.put("sampleData", validRows.subList(0, Math.min(10, validRows.size())));
            res.put("columns", headers);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Import preview failed: " + e.getMessage()));
        }
    }

    @PostMapping("/execute")
    public ResponseEntity<?> execute(@RequestBody Map<String, Object> body) {
        authorizationService.requireRole("admin", "manager");
        String type = body.get("type") != null ? (String) body.get("type") : "domains";
        Object jobIdObj = body.get("jobId");
        List<?> data = (List<?>) body.get("data");

        if (data == null || data.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No data rows to import."));
        }

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        Long userId = user != null ? user.getId() : null;
        String userName = user != null ? user.getUsername() : "System";

        int imported = 0, errors = 0;
        for (Object item : data) {
            if (item instanceof Map) {
                Map<?, ?> row = (Map<?, ?>) item;
                try {
                    String domain = (String) row.get("domain");
                    String url = (String) row.get("website_url");
                    if (domain == null && url != null) domain = DomainController.normalizeDomain(url);
                    if (url == null && domain != null) url = "https://" + domain;
                    if (domain == null || domain.trim().isEmpty()) {
                        errors++;
                        continue;
                    }

                    String ref = sequenceService.nextRef("DOM", "domain");
                    String niche = (String) row.get("niche");
                    String country = (String) row.get("country");
                    Integer da = row.get("da") != null && !String.valueOf(row.get("da")).isEmpty() ? Integer.valueOf(String.valueOf(row.get("da"))) : null;
                    Integer dr = row.get("dr") != null && !String.valueOf(row.get("dr")).isEmpty() ? Integer.valueOf(String.valueOf(row.get("dr"))) : null;
                    Integer traffic = row.get("organic_traffic") != null && !String.valueOf(row.get("organic_traffic")).isEmpty() ? Integer.valueOf(String.valueOf(row.get("organic_traffic"))) : null;
                    Integer spam = row.get("spam_score") != null && !String.valueOf(row.get("spam_score")).isEmpty() ? Integer.valueOf(String.valueOf(row.get("spam_score"))) : null;

                    jdbcTemplate.update(
                            "INSERT INTO domains (ref, domain, website_url, niche, country, da, dr, organic_traffic, spam_score, status, added_by, tags, created_at, updated_at) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                            ref, domain, url, niche, country, da, dr, traffic, spam, userId
                    );
                    imported++;
                } catch (Exception e) {
                    errors++;
                }
            }
        }

        if (jobIdObj != null) {
            jdbcTemplate.update("UPDATE import_jobs SET status='completed', completed_at=CURRENT_TIMESTAMP WHERE id=?", Long.valueOf(String.valueOf(jobIdObj)));
        }

        auditService.logActivity(userId, userName, "import", "import", null, "Imported " + imported + " " + type + " (" + errors + " errors)");

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("imported", imported);
        res.put("errors", errors);
        res.put("message", "Successfully imported " + imported + " records.");
        return ResponseEntity.ok(res);
    }

    @GetMapping("/jobs")
    public Map<String, Object> getJobs() {
        authorizationService.requireRole("admin", "manager");
        List<Map<String, Object>> jobs = jdbcTemplate.queryForList(
                "SELECT j.*, u.name AS created_by_name FROM import_jobs j LEFT JOIN users u ON u.id = j.created_by ORDER BY j.created_at DESC LIMIT 50"
        );
        return Map.of("jobs", jobs);
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<?> getJob(@PathVariable Long id) {
        authorizationService.requireRole("admin", "manager");
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT j.*, u.name AS created_by_name FROM import_jobs j LEFT JOIN users u ON u.id = j.created_by WHERE j.id = ?", id
        );
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Import job not found."));
        }
        Map<String, Object> job = rows.get(0);
        List<?> errors = Collections.emptyList();
        String report = (String) job.get("error_report");
        if (report != null && !report.isEmpty()) {
            try {
                errors = objectMapper.readValue(report, List.class);
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(Map.of("job", job, "errors", errors));
    }
}
