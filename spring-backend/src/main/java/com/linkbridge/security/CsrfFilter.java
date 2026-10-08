package com.linkbridge.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.WebUtils;

import java.io.IOException;
import java.util.Set;

public class CsrfFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");
    private static final Set<String> EXEMPT_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/csrf",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/error"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (SAFE_METHODS.contains(request.getMethod()) || EXEMPT_PATHS.contains(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        Cookie authCookie = WebUtils.getCookie(request, "bop_token");
        Cookie csrfCookie = WebUtils.getCookie(request, "bop_csrf");
        String headerCsrf = request.getHeader("X-CSRF-Token");

        boolean hasCookieAuth = (authCookie != null && authCookie.getValue() != null && !authCookie.getValue().isEmpty());
        boolean hasCsrfCookie = (csrfCookie != null && csrfCookie.getValue() != null && !csrfCookie.getValue().isEmpty());

        if (hasCookieAuth || hasCsrfCookie || headerCsrf != null) {
            String cookieCsrf = csrfCookie != null ? csrfCookie.getValue() : null;
            if (headerCsrf == null || cookieCsrf == null || !headerCsrf.equals(cookieCsrf)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"CSRF validation failed. Please refresh and retry.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
