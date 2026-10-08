package com.linkbridge.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.*;

@RestController
@RequestMapping("/api/meta")
public class MetaController {

    @GetMapping
    public Map<String, Object> getMeta() {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("roles", List.of("admin", "manager", "executive", "viewer"));
        res.put("domainStatuses", List.of("new", "qualified", "active", "used", "blocked", "rejected"));
        res.put("contactStatuses", List.of("new", "contacted", "follow_up_1", "follow_up_2", "follow_up_3", "replied", "negotiation", "agreed", "no_response", "rejected"));
        res.put("ourRequestStatuses", List.of("draft", "available", "contacted", "negotiation", "accepted", "exchanged", "rejected", "cancelled"));
        res.put("clientRequestStatuses", List.of("draft", "available", "contacted", "negotiation", "accepted", "exchanged", "rejected", "cancelled"));
        res.put("exchangeStatuses", List.of("pending", "negotiation", "agreed", "our_link_pending", "client_link_pending", "partially_completed", "completed", "cancelled"));
        res.put("backlinkStatuses", List.of("pending", "submitted", "published", "live", "lost", "rejected"));
        res.put("followUpStatuses", List.of("open", "in_progress", "completed", "rescheduled", "cancelled"));
        res.put("followUpKinds", List.of("contact", "verify", "publish", "negotiation", "other"));
        res.put("linkTypes", List.of("dofollow", "nofollow", "sponsored", "ugc"));
        res.put("placementTypes", List.of("content", "sidebar", "footer", "guest_post", "resource_page", "listicle"));
        res.put("exchangeTypes", List.of("link_exchange", "guest_post", "paid", "free", "reciprocal"));
        res.put("priorities", List.of("low", "medium", "high", "urgent"));
        res.put("backlinkSides", List.of("our", "client"));
        res.put("verificationResults", List.of("live", "lost", "error"));
        res.put("balances", List.of("balanced", "unbalanced", "pending", "our_live_client_pending", "client_live_our_pending", "both_pending", "both_lost"));

        Map<String, Object> s = new LinkedHashMap<>();
        s.put("live", Map.of("color", "#10b981", "bg", "#ecfdf5", "label", "Live"));
        s.put("lost", Map.of("color", "#ef4444", "bg", "#fef2f2", "label", "Lost"));
        s.put("completed", Map.of("color", "#10b981", "bg", "#ecfdf5", "label", "Completed"));
        s.put("pending", Map.of("color", "#f59e0b", "bg", "#fffbeb", "label", "Pending"));
        s.put("new", Map.of("color", "#6366f1", "bg", "#eef2ff", "label", "New"));
        s.put("qualified", Map.of("color", "#3b82f6", "bg", "#eff6ff", "label", "Qualified"));
        s.put("active", Map.of("color", "#10b981", "bg", "#ecfdf5", "label", "Active"));
        s.put("used", Map.of("color", "#8b5cf6", "bg", "#f5f3ff", "label", "Used"));
        s.put("blocked", Map.of("color", "#ef4444", "bg", "#fef2f2", "label", "Blocked"));
        s.put("rejected", Map.of("color", "#ef4444", "bg", "#fef2f2", "label", "Rejected"));
        s.put("draft", Map.of("color", "#94a3b8", "bg", "#f1f5f9", "label", "Draft"));
        s.put("available", Map.of("color", "#3b82f6", "bg", "#eff6ff", "label", "Available"));
        s.put("contacted", Map.of("color", "#3b82f6", "bg", "#eff6ff", "label", "Contacted"));
        s.put("negotiation", Map.of("color", "#f59e0b", "bg", "#fffbeb", "label", "Negotiation"));
        s.put("accepted", Map.of("color", "#10b981", "bg", "#ecfdf5", "label", "Accepted"));
        s.put("exchanged", Map.of("color", "#10b981", "bg", "#ecfdf5", "label", "Exchanged"));
        s.put("cancelled", Map.of("color", "#94a3b8", "bg", "#f1f5f9", "label", "Cancelled"));
        s.put("agreed", Map.of("color", "#3b82f6", "bg", "#eff6ff", "label", "Agreed"));
        s.put("our_link_pending", Map.of("color", "#f59e0b", "bg", "#fffbeb", "label", "Our Link Pending"));
        s.put("client_link_pending", Map.of("color", "#f59e0b", "bg", "#fffbeb", "label", "Client Link Pending"));
        s.put("partially_completed", Map.of("color", "#f59e0b", "bg", "#fffbeb", "label", "Partially Completed"));
        s.put("submitted", Map.of("color", "#3b82f6", "bg", "#eff6ff", "label", "Submitted"));
        s.put("published", Map.of("color", "#3b82f6", "bg", "#eff6ff", "label", "Published"));
        s.put("open", Map.of("color", "#3b82f6", "bg", "#eff6ff", "label", "Open"));
        s.put("in_progress", Map.of("color", "#f59e0b", "bg", "#fffbeb", "label", "In Progress"));
        s.put("rescheduled", Map.of("color", "#f59e0b", "bg", "#fffbeb", "label", "Rescheduled"));
        s.put("error", Map.of("color", "#ef4444", "bg", "#fef2f2", "label", "Error"));
        s.put("low", Map.of("color", "#94a3b8", "bg", "#f1f5f9", "label", "Low"));
        s.put("medium", Map.of("color", "#3b82f6", "bg", "#eff6ff", "label", "Medium"));
        s.put("high", Map.of("color", "#f59e0b", "bg", "#fffbeb", "label", "High"));
        s.put("urgent", Map.of("color", "#ef4444", "bg", "#fef2f2", "label", "Urgent"));
        s.put("balanced", Map.of("color", "#10b981", "bg", "#ecfdf5", "label", "Balanced"));
        s.put("unbalanced", Map.of("color", "#ef4444", "bg", "#fef2f2", "label", "Unbalanced"));
        s.put("both_lost", Map.of("color", "#ef4444", "bg", "#fef2f2", "label", "Both Lost"));
        s.put("our_live_client_pending", Map.of("color", "#f59e0b", "bg", "#fffbeb", "label", "Our Live / Client Pending"));
        s.put("client_live_our_pending", Map.of("color", "#f59e0b", "bg", "#fffbeb", "label", "Client Live / Our Pending"));
        s.put("both_pending", Map.of("color", "#94a3b8", "bg", "#f1f5f9", "label", "Both Pending"));

        res.put("statuses", s);
        return res;
    }
}
