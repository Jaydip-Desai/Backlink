package com.linkbridge.controller;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import com.linkbridge.service.AuthorizationService;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuthorizationService authorizationService;

    private String sanitizeCsvCell(Object val) {
        if (val == null) return "";
        String str = String.valueOf(val);
        if (!str.isEmpty() && (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@") || str.startsWith("\t") || str.startsWith("\r"))) {
            return "'" + str;
        }
        return str;
    }

    private List<Map<String, Object>> buildQuery(String type, Map<String, Object> filters) {
        StringBuilder sql = new StringBuilder();
        List<Object> params = new ArrayList<>();

        if ("backlinks".equalsIgnoreCase(type)) {
            sql.append("SELECT b.ref, b.side, b.referring_domain, b.referring_page_url, b.target_url, b.anchor_text, b.link_type, b.status, b.acquisition_date, b.last_verified_date, u.name AS assigned_name, e.ref AS exchange_ref FROM backlinks b LEFT JOIN users u ON u.id = b.assigned_to LEFT JOIN exchanges e ON e.id = b.exchange_id WHERE 1=1");
            if (filters.get("status") != null && !String.valueOf(filters.get("status")).isEmpty()) {
                sql.append(" AND b.status = ?");
                params.add(filters.get("status"));
            }
            if (filters.get("side") != null && !String.valueOf(filters.get("side")).isEmpty()) {
                sql.append(" AND b.side = ?");
                params.add(filters.get("side"));
            }
            sql.append(" ORDER BY b.created_at DESC");
        } else if ("exchanges".equalsIgnoreCase(type)) {
            sql.append("SELECT e.ref, e.partner_domain, e.exchange_type, e.status, e.exchange_date, e.priority, o.ref AS our_req, c.ref AS client_req, u.name AS assigned_name FROM exchanges e LEFT JOIN our_requests o ON o.id = e.our_request_id LEFT JOIN client_requests c ON c.id = e.client_request_id LEFT JOIN users u ON u.id = e.assigned_to WHERE 1=1");
            if (filters.get("status") != null && !String.valueOf(filters.get("status")).isEmpty()) {
                sql.append(" AND e.status = ?");
                params.add(filters.get("status"));
            }
            sql.append(" ORDER BY e.exchange_date DESC");
        } else if ("domains".equalsIgnoreCase(type)) {
            sql.append("SELECT ref, domain, niche, country, da, dr, organic_traffic, spam_score, status FROM domains WHERE 1=1");
            if (filters.get("status") != null && !String.valueOf(filters.get("status")).isEmpty()) {
                sql.append(" AND status = ?");
                params.add(filters.get("status"));
            }
            sql.append(" ORDER BY da DESC NULLS LAST");
        } else if ("lost_backlinks".equalsIgnoreCase(type)) {
            sql.append("SELECT b.ref, b.referring_domain, b.referring_page_url, b.target_url, b.anchor_text, b.status, b.last_verified_date, e.ref AS exchange_ref, u.name AS assigned_name FROM backlinks b LEFT JOIN users u ON u.id = b.assigned_to LEFT JOIN exchanges e ON e.id = b.exchange_id WHERE b.status = 'lost' ORDER BY b.last_verified_date DESC NULLS LAST");
        } else if ("team_performance".equalsIgnoreCase(type)) {
            sql.append("SELECT u.name, u.role, " +
                    "(SELECT COUNT(*) FROM domains d WHERE d.assigned_to=u.id) AS domains, " +
                    "(SELECT COUNT(*) FROM our_requests o WHERE o.assigned_to=u.id) AS our_requests, " +
                    "(SELECT COUNT(*) FROM client_requests c WHERE c.assigned_to=u.id) AS client_requests, " +
                    "(SELECT COUNT(*) FROM exchanges e WHERE e.assigned_to=u.id AND e.status='completed') AS completed_exchanges, " +
                    "(SELECT COUNT(*) FROM backlinks b WHERE b.assigned_to=u.id AND b.status='live') AS live_backlinks, " +
                    "(SELECT COUNT(*) FROM backlinks b WHERE b.assigned_to=u.id AND b.status='lost') AS lost_backlinks " +
                    "FROM users u WHERE u.status='active' ORDER BY completed_exchanges DESC");
        } else {
            // Default overview or fallback to backlinks
            sql.append("SELECT b.ref, b.side, b.referring_domain, b.referring_page_url, b.target_url, b.anchor_text, b.link_type, b.status, b.acquisition_date, b.last_verified_date, u.name AS assigned_name, e.ref AS exchange_ref FROM backlinks b LEFT JOIN users u ON u.id = b.assigned_to LEFT JOIN exchanges e ON e.id = b.exchange_id ORDER BY b.created_at DESC");
        }

        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    @RequestMapping(value = "/preview", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> preview(
            @RequestParam(required = false) String type,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        authorizationService.requireAuthenticated();
        Map<String, Object> filters = body != null ? body : new HashMap<>();
        String reportType = type != null && !type.trim().isEmpty() ? type : (String) filters.get("type");
        if (reportType == null || reportType.trim().isEmpty()) {
            reportType = "backlinks";
        }
        if ("team_performance".equalsIgnoreCase(reportType)) {
            authorizationService.requireRole("admin", "manager");
        }

        List<Map<String, Object>> rows = buildQuery(reportType, filters);
        int total = rows.size();
        List<Map<String, Object>> paged = rows.subList(0, Math.min(50, total));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("data", paged);
        res.put("total", total);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/export")
    public ResponseEntity<?> export(@RequestBody(required = false) Map<String, Object> body) {
        authorizationService.requireAuthenticated();
        Map<String, Object> filters = body != null ? body : Collections.emptyMap();
        String type = (String) filters.get("type");
        String format = filters.get("format") != null ? (String) filters.get("format") : "csv";
        if (type == null || type.trim().isEmpty()) {
            type = "backlinks";
        }
        if ("team_performance".equalsIgnoreCase(type)) {
            authorizationService.requireRole("admin", "manager");
        }

        List<Map<String, Object>> rows = buildQuery(type, filters);

        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        auditService.logActivity(user != null ? user.getId() : null, user != null ? user.getUsername() : "System", "export", "report", null, "Exported " + type + " report (" + format + ", " + rows.size() + " rows)");

        String filename = type + "-report-" + LocalDate.now() + "." + ("excel".equalsIgnoreCase(format) ? "xlsx" : format);

        if ("excel".equalsIgnoreCase(format)) {
            try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet(type);
                if (!rows.isEmpty()) {
                    Row headerRow = sheet.createRow(0);
                    List<String> headers = new ArrayList<>(rows.get(0).keySet());
                    for (int i = 0; i < headers.size(); i++) {
                        Cell cell = headerRow.createCell(i);
                        cell.setCellValue(headers.get(i));
                    }
                    int rowIdx = 1;
                    for (Map<String, Object> r : rows) {
                        Row row = sheet.createRow(rowIdx++);
                        for (int i = 0; i < headers.size(); i++) {
                            Cell cell = row.createCell(i);
                            Object val = r.get(headers.get(i));
                            cell.setCellValue(sanitizeCsvCell(val));
                        }
                    }
                }
                workbook.write(out);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(out.toByteArray());
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Export failed."));
            }
        } else {
            // CSV
            try (StringWriter sw = new StringWriter(); CSVPrinter printer = new CSVPrinter(sw, CSVFormat.DEFAULT)) {
                if (!rows.isEmpty()) {
                    List<String> headers = new ArrayList<>(rows.get(0).keySet());
                    printer.printRecord(headers);
                    for (Map<String, Object> r : rows) {
                        List<Object> values = new ArrayList<>();
                        for (String h : headers) {
                            values.add(sanitizeCsvCell(r.get(h)));
                        }
                        printer.printRecord(values);
                    }
                }
                printer.flush();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .contentType(MediaType.parseMediaType("text/csv"))
                        .body(sw.toString().getBytes(StandardCharsets.UTF_8));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Export failed."));
            }
        }
    }
}
