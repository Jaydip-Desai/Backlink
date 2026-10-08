package com.linkbridge.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public Map<String, Object> search(@RequestParam(required = false) String q) {
        String query = q != null ? q.trim() : "";
        if (query.length() < 2) {
            return Map.of("query", query, "results", Collections.emptyMap(), "domainSummary", Collections.emptyMap());
        }

        String term = "%" + query + "%";

        List<Map<String, Object>> domains = jdbcTemplate.queryForList(
                "SELECT id, ref, domain, website_url, da, dr, organic_traffic, status FROM domains " +
                "WHERE domain ILIKE ? OR website_url ILIKE ? OR niche ILIKE ? LIMIT 8",
                term, term, term
        );

        List<Map<String, Object>> ourRequests = jdbcTemplate.queryForList(
                "SELECT ref, partner_domain, target_url, anchor_text, status FROM our_requests " +
                "WHERE ref ILIKE ? OR partner_domain ILIKE ? OR target_url ILIKE ? OR anchor_text ILIKE ? LIMIT 8",
                term, term, term, term
        );

        List<Map<String, Object>> clientRequests = jdbcTemplate.queryForList(
                "SELECT ref, client_domain, client_target_url, anchor_text, status FROM client_requests " +
                "WHERE ref ILIKE ? OR client_domain ILIKE ? OR client_target_url ILIKE ? OR anchor_text ILIKE ? LIMIT 8",
                term, term, term, term
        );

        List<Map<String, Object>> exchanges = jdbcTemplate.queryForList(
                "SELECT ref, partner_domain, status FROM exchanges " +
                "WHERE ref ILIKE ? OR partner_domain ILIKE ? LIMIT 8",
                term, term
        );

        List<Map<String, Object>> backlinks = jdbcTemplate.queryForList(
                "SELECT ref, referring_domain, referring_page_url, target_url, anchor_text, status FROM backlinks " +
                "WHERE ref ILIKE ? OR referring_domain ILIKE ? OR referring_page_url ILIKE ? OR target_url ILIKE ? OR anchor_text ILIKE ? LIMIT 8",
                term, term, term, term, term
        );

        List<Map<String, Object>> contacts = jdbcTemplate.queryForList(
                "SELECT id, name, email, company FROM contacts " +
                "WHERE email ILIKE ? OR name ILIKE ? OR company ILIKE ? LIMIT 8",
                term, term, term
        );

        Map<String, Object> results = new LinkedHashMap<>();
        results.put("domains", domains);
        results.put("ourRequests", ourRequests);
        results.put("clientRequests", clientRequests);
        results.put("exchanges", exchanges);
        results.put("backlinks", backlinks);
        results.put("contacts", contacts);

        Map<String, Object> domainSummary = null;
        if (!domains.isEmpty()) {
            Map<String, Object> d = domains.get(0);
            String dName = (String) d.get("domain");
            int totalExchanges = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM exchanges WHERE partner_domain = ?", Integer.class, dName);
            List<Map<String, Object>> bls = jdbcTemplate.queryForList("SELECT status FROM backlinks WHERE referring_domain = ?", dName);
            int live = 0, lost = 0;
            for (Map<String, Object> b : bls) {
                if ("live".equalsIgnoreCase((String) b.get("status"))) live++;
                else if ("lost".equalsIgnoreCase((String) b.get("status"))) lost++;
            }
            domainSummary = new LinkedHashMap<>(d);
            domainSummary.put("totalExchanges", totalExchanges);
            domainSummary.put("totalBacklinks", bls.size());
            domainSummary.put("liveBacklinks", live);
            domainSummary.put("lostBacklinks", lost);
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("query", query);
        res.put("results", results);
        if (domainSummary != null) res.put("domainSummary", domainSummary);
        return res;
    }
}
