package com.linkbridge.service;

import com.linkbridge.security.SsrfValidator;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class VerificationService {

    private static final Logger log = LoggerFactory.getLogger(VerificationService.class);

    @Autowired
    private SsrfValidator ssrfValidator;

    public String verifyBacklink(String referringPageUrl, String targetUrl) {
        if (referringPageUrl == null || referringPageUrl.isBlank() || targetUrl == null || targetUrl.isBlank()) {
            return "invalid_parameters";
        }

        // 1. SSRF & Safe Hostname Verification
        if (!ssrfValidator.isSafeUrl(referringPageUrl)) {
            log.warn("[Security Alert] Blocked SSRF attempt to unauthorized target: {}", referringPageUrl);
            return "blocked_ssrf_risk";
        }

        try {
            // 2. Fetch DOM with size & timeout constraints
            Document doc = Jsoup.connect(referringPageUrl.trim())
                    .timeout(6000)
                    .maxBodySize(1024 * 1024) // 1MB Max to prevent memory exhaustion
                    .followRedirects(true)
                    .userAgent("LinkPilot-Bot/2.0 (+https://linkpilot.io/bot)")
                    .get();

            String cleanTarget = targetUrl.trim();
            Elements links = doc.select("a[href*=" + cleanTarget.replaceAll("[\"'\\[\\]]", "") + "]");
            if (!links.isEmpty()) {
                String rel = links.first().attr("rel").toLowerCase();
                if (rel.contains("nofollow")) {
                    return "live_nofollow";
                }
                if (rel.contains("sponsored")) {
                    return "live_sponsored";
                }
                if (rel.contains("ugc")) {
                    return "live_ugc";
                }
                return "live_dofollow";
            }
            return "lost";
        } catch (IOException e) {
            log.info("Verification unreachable for {}: {}", referringPageUrl, e.getMessage());
            return "unreachable_or_timeout";
        } catch (Exception e) {
            log.warn("Verification exception for {}: {}", referringPageUrl, e.getMessage());
            return "error_verification";
        }
    }
}
