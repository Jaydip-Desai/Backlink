package com.linkbridge.controller;

import com.linkbridge.entity.User;
import com.linkbridge.repository.UserRepository;
import com.linkbridge.security.JwtUtils;
import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import com.linkbridge.service.AuditService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private AuditService auditService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.linkbridge.security.RateLimiterService rateLimiterService;

    @Autowired
    private com.linkbridge.service.EmailService emailService;

    @Autowired
    private com.linkbridge.service.AuthorizationService authorizationService;

    private String generateCsrfToken() {
        return UUID.randomUUID().toString().replace("-", "") + System.currentTimeMillis();
    }

    private void setCookie(HttpServletResponse response, String name, String value, int maxAge, boolean httpOnly) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setHttpOnly(httpOnly);
        cookie.setMaxAge(maxAge);
        response.addCookie(cookie);
    }

    @GetMapping("/csrf")
    public Map<String, String> getCsrf(HttpServletResponse response) {
        String csrf = generateCsrfToken();
        setCookie(response, "bop_csrf", csrf, 7 * 24 * 3600, false);
        return Map.of("csrf", csrf);
    }

    @GetMapping("/invitation")
    public ResponseEntity<?> getInvitationDetails(@RequestParam("token") String token) {
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "Invitation token is required."));
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT i.id, i.token, i.email, i.role, i.organization_id, i.expires_at, o.name AS organization_name " +
            "FROM workspace_invitations i " +
            "LEFT JOIN organizations o ON i.organization_id = o.id " +
            "WHERE i.token = ? AND i.status = 'pending' AND i.expires_at > CURRENT_TIMESTAMP",
            token.trim()
        );
        if (rows.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "valid", false, 
                "error", "This workspace invitation is invalid, expired, or has already been accepted."
            ));
        }
        Map<String, Object> inv = rows.get(0);
        return ResponseEntity.ok(Map.of(
            "valid", true,
            "email", inv.get("email"),
            "role", inv.get("role"),
            "organization_name", inv.get("organization_name") != null ? inv.get("organization_name") : "LinkPilot Workspace",
            "organization_id", inv.get("organization_id")
        ));
    }

    @PostMapping("/invite")
    public ResponseEntity<?> inviteUser(@RequestBody Map<String, String> body, HttpServletRequest request) {
        UserDetailsImpl currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required."));
        }
        if (!authorizationService.hasPermission(com.linkbridge.service.AuthorizationService.PERM_TEAM_INVITE) &&
            !authorizationService.isOwnerOrAdmin(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You do not have permission to invite team members."));
        }

        String email = body.get("email");
        String role = body.get("role");
        String orgIdStr = body.get("organizationId");

        if (email == null || !email.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Valid email address is required."));
        }
        String normalizedEmail = email.trim().toLowerCase();

        if (role == null || role.isBlank()) {
            role = "seo_analyst";
        }
        role = role.toLowerCase().trim();

        // Enforce security: Administrator accounts can NEVER be invited via workspace invites
        if (role.contains("admin")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Cannot invite platform administrators via workspace invitations."));
        }

        Long orgId = 1L;
        if (orgIdStr != null && !orgIdStr.isBlank()) {
            try { orgId = Long.parseLong(orgIdStr); } catch (Exception ignored) {}
        } else {
            List<Map<String, Object>> userOrgs = jdbcTemplate.queryForList(
                "SELECT organization_id FROM organization_members WHERE user_id = ? LIMIT 1", currentUser.getId()
            );
            if (!userOrgs.isEmpty()) {
                orgId = ((Number) userOrgs.get(0).get("organization_id")).longValue();
            }
        }

        List<Map<String, Object>> orgRows = jdbcTemplate.queryForList("SELECT name FROM organizations WHERE id = ?", orgId);
        String orgName = !orgRows.isEmpty() ? String.valueOf(orgRows.get(0).get("name")) : "LinkPilot Workspace";

        String token = UUID.randomUUID().toString().replace("-", "") + System.currentTimeMillis();
        jdbcTemplate.update(
            "INSERT INTO workspace_invitations (token, organization_id, email, role, inviter_id, status, expires_at) " +
            "VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP + INTERVAL '7 days')",
            token, orgId, normalizedEmail, role, currentUser.getId()
        );

        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) origin = "http://localhost:5173";
        emailService.sendWorkspaceInvitationEmail(normalizedEmail, currentUser.getUsername(), orgName, role, token, origin);

        auditService.logActivity(currentUser.getId(), currentUser.getUsername(), "invite_user", "team", null, 
            "Invited " + normalizedEmail + " as " + role + " to " + orgName);

        return ResponseEntity.ok(Map.of(
            "ok", true,
            "message", "Invitation dispatched successfully to " + normalizedEmail,
            "token", token
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpServletRequest request, HttpServletResponse response) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required."));
        }

        String normalizedEmail = email.toLowerCase().trim();
        String clientIp = request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
        String rateLimitKey = normalizedEmail + "_" + clientIp;

        if (rateLimiterService.isBlocked(rateLimitKey)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many failed login attempts. Please wait 1 minute and try again."));
        }

        Optional<User> opt = userRepository.findByEmail(normalizedEmail);
        if (opt.isEmpty()) {
            rateLimiterService.recordFailure(rateLimitKey);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Incorrect email or password."));
        }

        User user = opt.get();
        if (!"active".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "This account is disabled. Please contact an administrator."));
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            rateLimiterService.recordFailure(rateLimitKey);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Incorrect email or password."));
        }

        rateLimiterService.reset(rateLimitKey);
        jdbcTemplate.update("UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?", user.getId());

        String token = jwtUtils.generateToken(user.getEmail(), user.getId(), user.getRole());
        String csrf = generateCsrfToken();

        setCookie(response, "bop_token", token, 7 * 24 * 3600, true);
        setCookie(response, "bop_csrf", csrf, 7 * 24 * 3600, false);

        auditService.logActivity(user.getId(), user.getName(), "login", "auth", null, "Signed in.");

        Map<String, Object> userData = new LinkedHashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("role", user.getRole());
        userData.put("title", user.getTitle());
        userData.put("avatar_color", user.getAvatarColor());
        userData.put("permissions", authorizationService.getPermissionsForRole(user.getRole()));

        List<Map<String, Object>> profileRows = jdbcTemplate.queryForList("SELECT * FROM user_profiles WHERE user_id = ?", user.getId());
        if (!profileRows.isEmpty()) {
            userData.put("profile", profileRows.get(0));
        }

        List<Map<String, Object>> orgRows = jdbcTemplate.queryForList(
            "SELECT o.id, o.name, o.org_type, o.website, om.role AS member_role " +
            "FROM organization_members om JOIN organizations o ON om.organization_id = o.id " +
            "WHERE om.user_id = ? LIMIT 1", user.getId()
        );
        if (!orgRows.isEmpty()) {
            userData.put("organization", orgRows.get(0));
        }

        Map<String, Object> res = new HashMap<>();
        res.put("user", userData);
        res.put("csrf", csrf);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request, HttpServletResponse response) {
        UserDetailsImpl userDetails = SecurityUtils.getCurrentUser();
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required."));
        }

        Optional<User> opt = userRepository.findByEmail(userDetails.getUsername());
        if (opt.isEmpty() || !"active".equalsIgnoreCase(opt.get().getStatus())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required."));
        }

        User user = opt.get();
        String csrf = generateCsrfToken();
        setCookie(response, "bop_csrf", csrf, 7 * 24 * 3600, false);

        Map<String, Object> userData = new LinkedHashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("role", user.getRole());
        userData.put("title", user.getTitle());
        userData.put("avatar_color", user.getAvatarColor());
        userData.put("permissions", authorizationService.getPermissionsForRole(user.getRole()));

        List<Map<String, Object>> profileRows = jdbcTemplate.queryForList("SELECT * FROM user_profiles WHERE user_id = ?", user.getId());
        if (!profileRows.isEmpty()) {
            userData.put("profile", profileRows.get(0));
        }

        List<Map<String, Object>> orgRows = jdbcTemplate.queryForList(
            "SELECT o.id, o.name, o.org_type, o.website, om.role AS member_role " +
            "FROM organization_members om JOIN organizations o ON om.organization_id = o.id " +
            "WHERE om.user_id = ? LIMIT 1", user.getId()
        );
        if (!orgRows.isEmpty()) {
            userData.put("organization", orgRows.get(0));
        }

        Map<String, Object> res = new HashMap<>();
        res.put("user", userData);
        res.put("csrf", csrf);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletResponse response) {
        UserDetailsImpl userDetails = SecurityUtils.getCurrentUser();
        if (userDetails != null) {
            auditService.logActivity(userDetails.getId(), userDetails.getUsername(), "logout", "auth", null, "Signed out.");
        }
        setCookie(response, "bop_token", "", 0, true);
        setCookie(response, "bop_csrf", "", 0, false);
        return Map.of("ok", true);
    }

    @PostMapping("/forgot-password")
    public Map<String, Object> forgotPassword(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String email = body.get("email");
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            origin = request.getHeader("Referer");
            if (origin != null && origin.contains("/login")) {
                origin = origin.substring(0, origin.indexOf("/login"));
            }
        }
        String clientIp = request.getRemoteAddr();
        String token = null;

        if (email != null && !email.trim().isEmpty()) {
            Optional<User> opt = userRepository.findByEmail(email.toLowerCase().trim());
            if (opt.isPresent()) {
                token = UUID.randomUUID().toString().replace("-", "") + System.currentTimeMillis();
                jdbcTemplate.update("UPDATE users SET reset_token = ?, reset_expires_at = CURRENT_TIMESTAMP + INTERVAL '1 hour' WHERE id = ?", token, opt.get().getId());
                try {
                    emailService.sendPasswordResetEmail(opt.get().getEmail(), opt.get().getName(), token, clientIp, origin);
                } catch (Exception ex) {
                    System.err.println("[LinkPilot Auth] Failed to dispatch password reset email: " + ex.getMessage());
                }
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("ok", true);
        res.put("message", "A password recovery email has been dispatched to " + (email != null ? email.trim() : "your address") + ". Please check your inbox or spam folder.");
        res.put("email", email != null ? email.trim() : "");
        if (token != null) {
            res.put("token", token);
            String base = (origin != null && !origin.isBlank()) ? origin : "http://localhost:5173";
            res.put("resetUrl", base + "/login?token=" + token + "&mode=reset");
        }
        return res;
    }

    @GetMapping("/verify-reset-token")
    public ResponseEntity<?> verifyResetToken(@RequestParam("token") String token) {
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "Missing token."));
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT id, email, name FROM users WHERE reset_token = ? AND reset_expires_at > CURRENT_TIMESTAMP", token);
        if (rows.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "Verification token is invalid or has expired."));
        }
        return ResponseEntity.ok(Map.of("valid", true, "email", rows.get(0).get("email")));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String password = body.get("password");
        if (token == null || token.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid reset link."));
        }
        if (password.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters long."));
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT id FROM users WHERE reset_token = ? AND reset_expires_at > CURRENT_TIMESTAMP", token);
        if (rows.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Reset link is invalid or has expired."));
        }
        Long userId = ((Number) rows.get(0).get("id")).longValue();
        String hash = passwordEncoder.encode(password);
        jdbcTemplate.update("UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", hash, userId);
        auditService.logActivity(userId, null, "password_reset", "auth", null, "Password was reset.");
        return ResponseEntity.ok(Map.of("message", "Password updated. Please sign in."));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        UserDetailsImpl userDetails = SecurityUtils.getCurrentUser();
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required."));
        }
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Both current and new passwords are required."));
        }
        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 8 characters long."));
        }

        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect."));
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditService.logActivity(user.getId(), user.getName(), "update", "auth", null, "Password changed.");
        return ResponseEntity.ok(Map.of("message", "Password updated."));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body, HttpServletResponse response) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT value FROM settings WHERE key = 'allow_registration'");
        String allowed = rows.isEmpty() ? "true" : String.valueOf(rows.get(0).get("value"));
        if (!"true".equalsIgnoreCase(allowed)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Registration is currently disabled by an administrator."));
        }

        String name = (String) body.get("name");
        String firstName = (String) body.get("firstName");
        String lastName = (String) body.get("lastName");
        if ((name == null || name.trim().isEmpty()) && (firstName != null || lastName != null)) {
            name = ((firstName != null ? firstName.trim() : "") + " " + (lastName != null ? lastName.trim() : "")).trim();
        }

        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String confirmPassword = (String) body.get("confirmPassword");
        Object termsObj = body.get("terms");
        String terms = termsObj != null ? String.valueOf(termsObj) : "false";

        // 1. Terms Acceptance
        if (!"true".equalsIgnoreCase(terms) && !"1".equals(terms)) {
            return ResponseEntity.badRequest().body(Map.of("error", "You must accept the Terms of Service and Privacy Policy."));
        }

        // 2. Full Name validation (2-100 characters, no control characters)
        if (name == null || name.trim().length() < 2 || name.trim().length() > 100) {
            return ResponseEntity.badRequest().body(Map.of("error", "Full name must be between 2 and 100 characters."));
        }
        if (name.chars().anyMatch(Character::isISOControl)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Full name cannot contain control characters."));
        }

        // 3. Email validation & normalization
        String normalizedEmail = (email != null ? email.trim().toLowerCase() : "");
        if (normalizedEmail.isEmpty() || normalizedEmail.length() > 255 || 
            !normalizedEmail.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please enter a valid work email address."));
        }

        // 4. Password validation (min 12 chars, upper, lower, digit, special character)
        if (password == null || password.length() < 12) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 12 characters long."));
        }
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(ch -> "!@#$%^&*()_+-=[]{}|;':\",./<>?`~\\".indexOf(ch) >= 0);

        if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must contain uppercase, lowercase, numbers, and special characters."));
        }

        // 5. Confirm password check
        if (confirmPassword != null && !confirmPassword.equals(password)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password confirmation does not match."));
        }

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "An account with this email already exists."));
        }

        // 6. Role & Invitation Determination
        String inviteToken = (String) body.get("inviteToken");
        Long inviteOrgId = null;
        String assignedRole = null;

        if (inviteToken != null && !inviteToken.isBlank()) {
            List<Map<String, Object>> invRows = jdbcTemplate.queryForList(
                "SELECT id, organization_id, email, role FROM workspace_invitations WHERE token = ? AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP",
                inviteToken.trim()
            );
            if (invRows.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "The workspace invitation token is invalid or has expired."));
            }
            Map<String, Object> inv = invRows.get(0);
            assignedRole = (String) inv.get("role");
            inviteOrgId = inv.get("organization_id") != null ? ((Number) inv.get("organization_id")).longValue() : 1L;
        } else {
            String roleInput = (String) body.get("role");
            if (roleInput == null || roleInput.isBlank()) {
                roleInput = (String) body.get("accountType");
            }
            if (roleInput == null || roleInput.isBlank()) {
                roleInput = "business_owner";
            }
            roleInput = roleInput.trim().toLowerCase();

            // CRITICAL SECURITY GUARD: Block public registration as platform administrator
            if (roleInput.contains("admin")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Platform administrator accounts cannot be self-registered publicly. Admin accounts must be provisioned through a controlled deployment or authorized platform administrator."
                ));
            }

            // Map allowed public registration roles
            if (roleInput.contains("agency")) {
                assignedRole = "agency_owner";
            } else if (roleInput.contains("pro") || roleInput.contains("specialist") || roleInput.contains("analyst")) {
                assignedRole = "seo_professional";
            } else {
                assignedRole = "business_owner";
            }
        }

        String[] colors = {"#6366f1","#f59e0b","#10b981","#ec4899","#06b6d4","#8b5cf6"};
        String color = colors[new Random().nextInt(colors.length)];

        // 7. Persist User Entity
        User user = new User();
        user.setName(name.trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(assignedRole);
        user.setStatus("active");
        user.setAvatarColor(color);
        user = userRepository.save(user);

        // 8. Extract & Persist User Profile
        String phone = (String) body.get("phone");
        String country = (String) body.get("country");
        String timezone = (String) body.get("timezone");
        String language = (String) body.get("preferredLanguage");
        String jobTitle = (String) body.get("jobTitle");
        String experienceLevel = (String) body.get("experienceLevel");
        String specialization = (String) body.get("specialization");
        String primaryResponsibilities = (String) body.get("primaryResponsibilities");
        String outreachEmail = (String) body.get("outreachEmail");
        String senderName = (String) body.get("senderName");
        String senderCompany = (String) body.get("senderCompany");
        String senderWebsite = (String) body.get("senderWebsite");
        String defaultSignature = (String) body.get("defaultSignature");
        String targetIndustries = (String) body.get("targetIndustries");
        String agencyServices = (String) body.get("agencyServices");
        String agencyTeamSize = (String) body.get("agencyTeamSize");
        String primarySeoGoal = (String) body.get("primarySeoGoal");

        Integer clientCount = 0;
        if (body.get("clientCount") instanceof Number n) clientCount = n.intValue();

        Integer monthlyLinkGoal = 10;
        if (body.get("monthlyLinkGoal") instanceof Number n) monthlyLinkGoal = n.intValue();

        // Calculate profile completion score
        int completion = 60;
        if (phone != null && !phone.isBlank()) completion += 10;
        if (jobTitle != null && !jobTitle.isBlank()) completion += 10;
        if (primarySeoGoal != null && !primarySeoGoal.isBlank()) completion += 10;
        if (specialization != null || agencyServices != null || outreachEmail != null) completion += 10;
        completion = Math.min(completion, 100);

        try {
            jdbcTemplate.update(
                "INSERT INTO user_profiles (user_id, first_name, last_name, phone, country, timezone, preferred_language, " +
                "job_title, experience_level, specialization, primary_responsibilities, outreach_email, sender_name, " +
                "sender_company, sender_website, default_signature, target_industries, agency_services, client_count, " +
                "agency_team_size, primary_seo_goal, monthly_link_goal, profile_completion_pct) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                user.getId(), firstName, lastName, phone, country != null ? country : "United States",
                timezone != null ? timezone : "UTC", language != null ? language : "English",
                jobTitle, experienceLevel, specialization, primaryResponsibilities, outreachEmail, senderName,
                senderCompany, senderWebsite, defaultSignature, targetIndustries, agencyServices, clientCount,
                agencyTeamSize, primarySeoGoal, monthlyLinkGoal, completion
            );
        } catch (Exception e) {
            // Profile table fallback if migration pending
        }

        // 9. Organization & Workspace Provisioning
        Long finalOrgId = inviteOrgId;
        String orgName = (String) body.get("organizationName");
        if (orgName == null || orgName.isBlank()) {
            orgName = name + "'s Workspace";
        }

        if (inviteToken != null && !inviteToken.isBlank()) {
            // Accepted invitation
            try {
                jdbcTemplate.update(
                    "INSERT INTO organization_members (organization_id, user_id, role) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
                    finalOrgId, user.getId(), assignedRole
                );
                jdbcTemplate.update("UPDATE workspace_invitations SET status = 'accepted' WHERE token = ?", inviteToken.trim());
            } catch (Exception ignored) {}
        } else {
            // New Workspace / Organization creation for owners & professionals
            try {
                String orgType = "agency_owner".equalsIgnoreCase(assignedRole) ? "agency" : 
                                 "seo_professional".equalsIgnoreCase(assignedRole) ? "consultant" : "business";
                String industry = (String) body.get("industry");
                String companySize = (String) body.get("companySize");
                String companyWebsite = (String) body.get("companyWebsite");

                Number generatedOrgId = jdbcTemplate.queryForObject(
                    "INSERT INTO organizations (name, org_type, industry, company_size, website, country, created_by) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
                    Long.class,
                    orgName, orgType, industry, companySize, companyWebsite, country, user.getId()
                );
                if (generatedOrgId != null) {
                    finalOrgId = generatedOrgId.longValue();
                    jdbcTemplate.update(
                        "INSERT INTO organization_members (organization_id, user_id, role) VALUES (?, ?, 'owner')",
                        finalOrgId, user.getId()
                    );
                }
            } catch (Exception ignored) {}
        }

        // 10. Automatically Provision First Project if Primary Website is provided
        String primaryWebsite = (String) body.get("primaryWebsite");
        if (primaryWebsite != null && !primaryWebsite.isBlank()) {
            try {
                String cleanUrl = primaryWebsite.trim();
                if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
                    cleanUrl = "https://" + cleanUrl;
                }
                String domain = cleanUrl.replaceFirst("^(https?://)?(www\\.)?", "").split("/")[0].toLowerCase();
                String projectName = (String) body.get("projectName");
                if (projectName == null || projectName.isBlank()) {
                    projectName = domain.toUpperCase() + " Core";
                }

                Number generatedProjId = jdbcTemplate.queryForObject(
                    "INSERT INTO projects (user_id, organization_id, name, website_url, domain, industry, country, target_language) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
                    Long.class,
                    user.getId(), finalOrgId, projectName, cleanUrl, domain, 
                    body.get("industry") != null ? (String) body.get("industry") : "Technology",
                    country != null ? country : "United States",
                    language != null ? language : "English"
                );

                // Add initial competitors if provided
                Object compsObj = body.get("competitors");
                if (generatedProjId != null && compsObj != null) {
                    List<String> comps = new ArrayList<>();
                    if (compsObj instanceof List<?> list) {
                        for (Object o : list) if (o != null) comps.add(String.valueOf(o).trim().toLowerCase());
                    } else if (compsObj instanceof String s) {
                        for (String part : s.split("[,\\n]+")) if (!part.isBlank()) comps.add(part.trim().toLowerCase());
                    }

                    for (String comp : comps) {
                        String cleanComp = comp.replaceFirst("^(https?://)?(www\\.)?", "").split("/")[0];
                        if (!cleanComp.isBlank() && !cleanComp.equalsIgnoreCase(domain)) {
                            jdbcTemplate.update(
                                "INSERT INTO competitors (project_id, domain, name) VALUES (?, ?, ?)",
                                generatedProjId.longValue(), cleanComp, cleanComp
                            );
                        }
                    }
                }
            } catch (Exception e) {
                // Ignore project creation error to ensure registration completes
            }
        }

        // 11. Security, Audit, and Email Dispatch
        emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        auditService.logActivity(user.getId(), user.getName(), "register", "auth", null, 
            "Role-based onboarding completed as " + assignedRole);

        String token = jwtUtils.generateToken(user.getEmail(), user.getId(), user.getRole());
        String csrf = generateCsrfToken();
        setCookie(response, "bop_token", token, 7 * 24 * 3600, true);
        setCookie(response, "bop_csrf", csrf, 7 * 24 * 3600, false);

        Map<String, Object> userData = new LinkedHashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("role", user.getRole());
        userData.put("title", user.getTitle());
        userData.put("avatar_color", user.getAvatarColor());
        userData.put("permissions", authorizationService.getPermissionsForRole(user.getRole()));

        Map<String, Object> res = new HashMap<>();
        res.put("user", userData);
        res.put("csrf", csrf);
        res.put("organizationId", finalOrgId);
        res.put("organizationName", orgName);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Verification token is required."));
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, email, email_verified, verification_expires_at FROM users WHERE verification_token = ?", token.trim()
        );
        if (rows.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "This verification link has expired. Please request a new one."));
        }
        Map<String, Object> u = rows.get(0);
        if (Boolean.TRUE.equals(u.get("email_verified"))) {
            return ResponseEntity.ok(Map.of("message", "This email has already been verified. Please sign in."));
        }
        java.sql.Timestamp exp = (java.sql.Timestamp) u.get("verification_expires_at");
        if (exp != null && exp.before(new java.util.Date())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This verification link has expired. Please request a new one."));
        }
        jdbcTemplate.update("UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", u.get("id"));
        return ResponseEntity.ok(Map.of("message", "Email verified successfully! You can now access your workspace."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String email = body.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required."));
        }
        String normalizedEmail = email.trim().toLowerCase();
        String clientIp = request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
        String rateLimitKey = "verify_" + normalizedEmail + "_" + clientIp;
        if (rateLimiterService.isBlocked(rateLimitKey)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                "error", "You're doing that too often. Please wait a moment and try again."
            ));
        }

        Optional<User> opt = userRepository.findByEmail(normalizedEmail);
        if (opt.isPresent()) {
            User user = opt.get();
            if (!Boolean.TRUE.equals(user.getEmailVerified())) {
                String token = UUID.randomUUID().toString().replace("-", "");
                jdbcTemplate.update(
                    "UPDATE users SET verification_token = ?, verification_expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours' WHERE id = ?",
                    token, user.getId()
                );
                rateLimiterService.recordFailure(rateLimitKey);
            }
        }
        return ResponseEntity.ok(Map.of("message", "If an unverified account exists with that address, a new verification link has been sent."));
    }
}
