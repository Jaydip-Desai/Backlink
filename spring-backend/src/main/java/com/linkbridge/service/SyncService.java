package com.linkbridge.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SyncService {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public Map<String, Object> getExchangeBalance(Long exchangeId) {
        List<Map<String, Object>> bls = jdbcTemplate.queryForList(
            "SELECT side, status FROM backlinks WHERE exchange_id = ?", exchangeId
        );
        String ourState = "none";
        String clientState = "none";
        for (Map<String, Object> b : bls) {
            String side = (String) b.get("side");
            String status = (String) b.get("status");
            if ("our".equals(side)) ourState = status;
            else if ("client".equals(side)) clientState = status;
        }

        String balance;
        if ("live".equals(ourState) && "live".equals(clientState)) {
            balance = "balanced";
        } else if ("lost".equals(ourState) && "lost".equals(clientState)) {
            balance = "both_lost";
        } else if ("lost".equals(ourState) || "lost".equals(clientState)) {
            balance = "unbalanced";
        } else if ("live".equals(ourState) && !"live".equals(clientState)) {
            balance = "our_live_client_pending";
        } else if (!"live".equals(ourState) && "live".equals(clientState)) {
            balance = "client_live_our_pending";
        } else {
            balance = "both_pending";
        }

        Map<String, Object> res = new HashMap<>();
        res.put("balance", balance);
        res.put("ourState", ourState);
        res.put("clientState", clientState);
        return res;
    }

    public void syncExchangeStatus(Long exchangeId) {
        Map<String, Object> bal = getExchangeBalance(exchangeId);
        String balance = (String) bal.get("balance");
        String ourState = (String) bal.get("ourState");
        String clientState = (String) bal.get("clientState");

        String newStatus;
        if ("balanced".equals(balance)) {
            newStatus = "completed";
        } else if ("live".equals(ourState) && !"live".equals(clientState)) {
            newStatus = "client_link_pending";
        } else if (!"live".equals(ourState) && "live".equals(clientState)) {
            newStatus = "our_link_pending";
        } else if ("unbalanced".equals(balance)) {
            newStatus = "partially_completed";
        } else {
            newStatus = "pending";
        }

        jdbcTemplate.update(
            "UPDATE exchanges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            newStatus, exchangeId
        );
    }
}
