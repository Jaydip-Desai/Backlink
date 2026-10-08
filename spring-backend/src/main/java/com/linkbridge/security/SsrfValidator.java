package com.linkbridge.security;

import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;

/**
 * Enterprise SSRF (Server-Side Request Forgery) & Hostname Security Validator.
 * Blocks requests to internal networks, localhost, link-local, private subnets,
 * cloud metadata endpoints (169.254.169.254), and prevents DNS rebinding vulnerabilities.
 */
@Component
public class SsrfValidator {

    public boolean isSafeUrl(String urlString) {
        if (urlString == null || urlString.isBlank()) {
            return false;
        }

        try {
            URI uri = URI.create(urlString.trim());
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                return false;
            }

            // Reject embedded credentials in URLs (e.g. http://user:pass@host)
            if (uri.getUserInfo() != null) {
                return false;
            }

            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                return false;
            }

            String lowerHost = host.toLowerCase();
            if (lowerHost.equals("localhost") || lowerHost.endsWith(".localhost") || 
                lowerHost.endsWith(".local") || lowerHost.endsWith(".internal") || lowerHost.endsWith(".onion")) {
                return false;
            }

            // Resolve DNS and inspect all resolved IP addresses
            InetAddress[] addresses = InetAddress.getAllByName(host);
            for (InetAddress addr : addresses) {
                if (isPrivateOrLocalAddress(addr)) {
                    return false;
                }
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean isPrivateOrLocalAddress(InetAddress addr) {
        if (addr.isLoopbackAddress() || addr.isAnyLocalAddress() || addr.isLinkLocalAddress() || addr.isSiteLocalAddress()) {
            return true;
        }

        byte[] ip = addr.getAddress();
        if (ip.length == 4) {
            int b0 = ip[0] & 0xFF;
            int b1 = ip[1] & 0xFF;

            // 10.0.0.0/8
            if (b0 == 10) return true;
            // 172.16.0.0/12
            if (b0 == 172 && (b1 >= 16 && b1 <= 31)) return true;
            // 192.168.0.0/16
            if (b0 == 192 && b1 == 168) return true;
            // 127.0.0.0/8
            if (b0 == 127) return true;
            // 169.254.0.0/16 (Link-Local & Cloud Metadata e.g. 169.254.169.254)
            if (b0 == 169 && b1 == 254) return true;
            // 0.0.0.0/8
            if (b0 == 0) return true;
            // 100.64.0.0/10 (Carrier-grade NAT)
            if (b0 == 100 && (b1 >= 64 && b1 <= 127)) return true;
        } else if (ip.length == 16) {
            // IPv6 unique local (fc00::/7) or link-local (fe80::/10)
            int b0 = ip[0] & 0xFF;
            if ((b0 & 0xFE) == 0xFC || (b0 == 0xFE && (ip[1] & 0xC0) == 0x80)) {
                return true;
            }
        }
        return false;
    }
}
