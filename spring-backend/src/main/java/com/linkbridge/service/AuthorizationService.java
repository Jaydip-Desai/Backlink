package com.linkbridge.service;

import com.linkbridge.security.SecurityUtils;
import com.linkbridge.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AuthorizationService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Role Constants
    public static final String ROLE_ADMIN = "admin";
    public static final String ROLE_OWNER = "owner";
    public static final String ROLE_AGENCY_OWNER = "agency_owner";
    public static final String ROLE_BUSINESS_OWNER = "business_owner";
    public static final String ROLE_SEO_MANAGER = "seo_manager";
    public static final String ROLE_SEO_ANALYST = "seo_analyst";
    public static final String ROLE_OUTREACH_MANAGER = "outreach_manager";
    public static final String ROLE_OUTREACH_SPECIALIST = "outreach_specialist";
    public static final String ROLE_CONTENT_SPECIALIST = "content_specialist";
    public static final String ROLE_CLIENT = "client";
    public static final String ROLE_VIEWER = "viewer";

    // Permission Constants
    public static final String PERM_PROJECT_VIEW = "PROJECT_VIEW";
    public static final String PERM_PROJECT_CREATE = "PROJECT_CREATE";
    public static final String PERM_PROJECT_EDIT = "PROJECT_EDIT";
    public static final String PERM_PROJECT_DELETE = "PROJECT_DELETE";

    public static final String PERM_BACKLINK_VIEW = "BACKLINK_VIEW";
    public static final String PERM_BACKLINK_IMPORT = "BACKLINK_IMPORT";
    public static final String PERM_BACKLINK_EDIT = "BACKLINK_EDIT";
    public static final String PERM_BACKLINK_DELETE = "BACKLINK_DELETE";
    public static final String PERM_BACKLINK_EXPORT = "BACKLINK_EXPORT";

    public static final String PERM_AUDIT_VIEW = "AUDIT_VIEW";
    public static final String PERM_AUDIT_RUN = "AUDIT_RUN";
    public static final String PERM_AUDIT_REVIEW = "AUDIT_REVIEW";

    public static final String PERM_COMPETITOR_VIEW = "COMPETITOR_VIEW";
    public static final String PERM_COMPETITOR_CREATE = "COMPETITOR_CREATE";
    public static final String PERM_COMPETITOR_EDIT = "COMPETITOR_EDIT";
    public static final String PERM_COMPETITOR_DELETE = "COMPETITOR_DELETE";

    public static final String PERM_OUTREACH_VIEW = "OUTREACH_VIEW";
    public static final String PERM_OUTREACH_CREATE = "OUTREACH_CREATE";
    public static final String PERM_OUTREACH_EDIT = "OUTREACH_EDIT";
    public static final String PERM_OUTREACH_DELETE = "OUTREACH_DELETE";
    public static final String PERM_OUTREACH_SEND = "OUTREACH_SEND";

    public static final String PERM_REPORT_VIEW = "REPORT_VIEW";
    public static final String PERM_REPORT_CREATE = "REPORT_CREATE";
    public static final String PERM_REPORT_EXPORT = "REPORT_EXPORT";

    public static final String PERM_TEAM_VIEW = "TEAM_VIEW";
    public static final String PERM_TEAM_INVITE = "TEAM_INVITE";
    public static final String PERM_TEAM_EDIT = "TEAM_EDIT";
    public static final String PERM_TEAM_REMOVE = "TEAM_REMOVE";

    public static final String PERM_INTEGRATION_VIEW = "INTEGRATION_VIEW";
    public static final String PERM_INTEGRATION_CONNECT = "INTEGRATION_CONNECT";
    public static final String PERM_INTEGRATION_DISCONNECT = "INTEGRATION_DISCONNECT";

    public static final String PERM_SECURITY_VIEW = "SECURITY_VIEW";
    public static final String PERM_SECURITY_MANAGE = "SECURITY_MANAGE";

    public static final String PERM_ADMIN_USERS = "ADMIN_USERS";
    public static final String PERM_ADMIN_ROLES = "ADMIN_ROLES";
    public static final String PERM_ADMIN_SYSTEM = "ADMIN_SYSTEM";

    private static final java.util.Map<String, java.util.Set<String>> ROLE_PERMISSIONS = new java.util.HashMap<>();

    static {
        // Admin: all permissions
        java.util.Set<String> all = new java.util.HashSet<>(java.util.List.of(
            PERM_PROJECT_VIEW, PERM_PROJECT_CREATE, PERM_PROJECT_EDIT, PERM_PROJECT_DELETE,
            PERM_BACKLINK_VIEW, PERM_BACKLINK_IMPORT, PERM_BACKLINK_EDIT, PERM_BACKLINK_DELETE, PERM_BACKLINK_EXPORT,
            PERM_AUDIT_VIEW, PERM_AUDIT_RUN, PERM_AUDIT_REVIEW,
            PERM_COMPETITOR_VIEW, PERM_COMPETITOR_CREATE, PERM_COMPETITOR_EDIT, PERM_COMPETITOR_DELETE,
            PERM_OUTREACH_VIEW, PERM_OUTREACH_CREATE, PERM_OUTREACH_EDIT, PERM_OUTREACH_DELETE, PERM_OUTREACH_SEND,
            PERM_REPORT_VIEW, PERM_REPORT_CREATE, PERM_REPORT_EXPORT,
            PERM_TEAM_VIEW, PERM_TEAM_INVITE, PERM_TEAM_EDIT, PERM_TEAM_REMOVE,
            PERM_INTEGRATION_VIEW, PERM_INTEGRATION_CONNECT, PERM_INTEGRATION_DISCONNECT,
            PERM_SECURITY_VIEW, PERM_SECURITY_MANAGE,
            PERM_ADMIN_USERS, PERM_ADMIN_ROLES, PERM_ADMIN_SYSTEM
        ));
        ROLE_PERMISSIONS.put(ROLE_ADMIN, all);

        // Owners (Business / Agency / Workspace Owner)
        java.util.Set<String> ownerPerms = new java.util.HashSet<>(java.util.List.of(
            PERM_PROJECT_VIEW, PERM_PROJECT_CREATE, PERM_PROJECT_EDIT, PERM_PROJECT_DELETE,
            PERM_BACKLINK_VIEW, PERM_BACKLINK_IMPORT, PERM_BACKLINK_EDIT, PERM_BACKLINK_DELETE, PERM_BACKLINK_EXPORT,
            PERM_AUDIT_VIEW, PERM_AUDIT_RUN, PERM_AUDIT_REVIEW,
            PERM_COMPETITOR_VIEW, PERM_COMPETITOR_CREATE, PERM_COMPETITOR_EDIT, PERM_COMPETITOR_DELETE,
            PERM_OUTREACH_VIEW, PERM_OUTREACH_CREATE, PERM_OUTREACH_EDIT, PERM_OUTREACH_DELETE, PERM_OUTREACH_SEND,
            PERM_REPORT_VIEW, PERM_REPORT_CREATE, PERM_REPORT_EXPORT,
            PERM_TEAM_VIEW, PERM_TEAM_INVITE, PERM_TEAM_EDIT, PERM_TEAM_REMOVE,
            PERM_INTEGRATION_VIEW, PERM_INTEGRATION_CONNECT, PERM_INTEGRATION_DISCONNECT,
            PERM_SECURITY_VIEW, PERM_SECURITY_MANAGE
        ));
        ROLE_PERMISSIONS.put(ROLE_OWNER, ownerPerms);
        ROLE_PERMISSIONS.put(ROLE_AGENCY_OWNER, ownerPerms);
        ROLE_PERMISSIONS.put(ROLE_BUSINESS_OWNER, ownerPerms);

        // SEO Manager
        ROLE_PERMISSIONS.put(ROLE_SEO_MANAGER, new java.util.HashSet<>(java.util.List.of(
            PERM_PROJECT_VIEW, PERM_PROJECT_CREATE, PERM_PROJECT_EDIT,
            PERM_BACKLINK_VIEW, PERM_BACKLINK_IMPORT, PERM_BACKLINK_EDIT, PERM_BACKLINK_EXPORT,
            PERM_AUDIT_VIEW, PERM_AUDIT_RUN, PERM_AUDIT_REVIEW,
            PERM_COMPETITOR_VIEW, PERM_COMPETITOR_CREATE, PERM_COMPETITOR_EDIT,
            PERM_OUTREACH_VIEW, PERM_REPORT_VIEW, PERM_REPORT_CREATE, PERM_REPORT_EXPORT,
            PERM_TEAM_VIEW, PERM_TEAM_INVITE,
            PERM_INTEGRATION_VIEW, PERM_INTEGRATION_CONNECT
        )));

        // SEO Analyst
        ROLE_PERMISSIONS.put(ROLE_SEO_ANALYST, new java.util.HashSet<>(java.util.List.of(
            PERM_PROJECT_VIEW,
            PERM_BACKLINK_VIEW, PERM_BACKLINK_EXPORT,
            PERM_AUDIT_VIEW, PERM_AUDIT_RUN,
            PERM_COMPETITOR_VIEW, PERM_COMPETITOR_CREATE,
            PERM_REPORT_VIEW, PERM_REPORT_CREATE, PERM_REPORT_EXPORT
        )));

        // Outreach Manager
        ROLE_PERMISSIONS.put(ROLE_OUTREACH_MANAGER, new java.util.HashSet<>(java.util.List.of(
            PERM_PROJECT_VIEW,
            PERM_BACKLINK_VIEW,
            PERM_OUTREACH_VIEW, PERM_OUTREACH_CREATE, PERM_OUTREACH_EDIT, PERM_OUTREACH_DELETE, PERM_OUTREACH_SEND,
            PERM_REPORT_VIEW, PERM_REPORT_EXPORT
        )));

        // Outreach Specialist
        ROLE_PERMISSIONS.put(ROLE_OUTREACH_SPECIALIST, new java.util.HashSet<>(java.util.List.of(
            PERM_PROJECT_VIEW,
            PERM_OUTREACH_VIEW, PERM_OUTREACH_CREATE, PERM_OUTREACH_EDIT, PERM_OUTREACH_SEND
        )));

        // Content Specialist
        ROLE_PERMISSIONS.put(ROLE_CONTENT_SPECIALIST, new java.util.HashSet<>(java.util.List.of(
            PERM_PROJECT_VIEW,
            PERM_BACKLINK_VIEW,
            PERM_OUTREACH_VIEW, PERM_OUTREACH_CREATE,
            PERM_REPORT_VIEW
        )));

        // Client / Website Owner
        ROLE_PERMISSIONS.put(ROLE_CLIENT, new java.util.HashSet<>(java.util.List.of(
            PERM_PROJECT_VIEW,
            PERM_BACKLINK_VIEW,
            PERM_REPORT_VIEW, PERM_REPORT_EXPORT
        )));

        // Viewer (Read-only)
        ROLE_PERMISSIONS.put(ROLE_VIEWER, new java.util.HashSet<>(java.util.List.of(
            PERM_PROJECT_VIEW,
            PERM_BACKLINK_VIEW,
            PERM_REPORT_VIEW
        )));
    }

    public java.util.Set<String> getPermissionsForRole(String role) {
        if (role == null) return java.util.Collections.emptySet();
        String normalized = role.toLowerCase().trim();
        return ROLE_PERMISSIONS.getOrDefault(normalized, ROLE_PERMISSIONS.getOrDefault("viewer", java.util.Collections.emptySet()));
    }

    public boolean hasPermission(String permission) {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        if (user == null) return false;
        String role = getUserRole(user);
        return getPermissionsForRole(role).contains(permission);
    }

    public void requirePermission(String permission) {
        if (!hasPermission(permission)) {
            throw new AccessDeniedException("Access denied: You lack required permission [" + permission + "].");
        }
    }

    public void checkLastOwnerProtection(Long organizationId, Long userIdToModify) {
        if (organizationId == null || userIdToModify == null) return;
        List<Map<String, Object>> owners = jdbcTemplate.queryForList(
            "SELECT user_id FROM organization_members WHERE organization_id = ? AND role IN ('owner', 'agency_owner', 'business_owner')",
            organizationId
        );
        if (owners.size() <= 1 && owners.stream().anyMatch(row -> userIdToModify.equals(((Number) row.get("user_id")).longValue()))) {
            throw new AccessDeniedException("Cannot remove or demote the last remaining owner of this organization. Please assign another owner first.");
        }
    }

    public void preventSelfRoleEscalation(UserDetailsImpl currentUser, Long targetUserId, String newRole) {
        if (currentUser.getId().equals(targetUserId)) {
            String currentRole = getUserRole(currentUser);
            if (!currentRole.equalsIgnoreCase(newRole) && !ROLE_ADMIN.equalsIgnoreCase(currentRole)) {
                throw new AccessDeniedException("Users are not permitted to alter or escalate their own role.");
            }
        }
    }

    public void requireAuthenticated() {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new AccessDeniedException("Authentication required.");
        }
    }

    public void requireRole(String... roles) {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new AccessDeniedException("Authentication required.");
        }
        String userRole = getUserRole(user);
        for (String r : roles) {
            if (r.equalsIgnoreCase(userRole)) {
                return;
            }
        }
        throw new AccessDeniedException("You do not have permission to perform this action.");
    }

    public void requireWrite() {
        UserDetailsImpl user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new AccessDeniedException("Authentication required.");
        }
        String userRole = getUserRole(user);
        if ("viewer".equalsIgnoreCase(userRole) || "client".equalsIgnoreCase(userRole)) {
            throw new AccessDeniedException("Read-only access. This action is not permitted.");
        }
    }

    public String getUserRole(UserDetailsImpl user) {
        if (user == null) return "";
        return user.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", "").toLowerCase())
                .orElse("");
    }

    public boolean isOwnerOrAdmin(UserDetailsImpl user) {
        String role = getUserRole(user);
        return ROLE_ADMIN.equalsIgnoreCase(role) || 
               ROLE_OWNER.equalsIgnoreCase(role) || 
               ROLE_AGENCY_OWNER.equalsIgnoreCase(role) || 
               ROLE_BUSINESS_OWNER.equalsIgnoreCase(role);
    }

    public boolean isAdminOrManager(UserDetailsImpl user) {
        String role = getUserRole(user);
        return isOwnerOrAdmin(user) || ROLE_SEO_MANAGER.equalsIgnoreCase(role);
    }

    public void authorizeDomainAccess(UserDetailsImpl user, Map<String, Object> domain) {
        if (isAdminOrManager(user)) return;
        // Executive can view domains (it is the shared domain inventory), but write operations are checked separately
    }

    public void authorizeDomainWrite(UserDetailsImpl user, Map<String, Object> domain) {
        requireWrite();
        if (isAdminOrManager(user)) return;
        Object assignedTo = domain.get("assigned_to");
        Object addedBy = domain.get("added_by");
        Long uid = user.getId();
        if (assignedTo != null && uid.equals(((Number) assignedTo).longValue())) return;
        if (addedBy != null && uid.equals(((Number) addedBy).longValue())) return;
        throw new AccessDeniedException("You are not authorized to modify this domain.");
    }

    public void authorizeOurRequestWrite(UserDetailsImpl user, Map<String, Object> request) {
        requireWrite();
        if (isAdminOrManager(user)) return;
        Object assignedTo = request.get("assigned_to");
        Object createdBy = request.get("created_by");
        Long uid = user.getId();
        if (assignedTo != null && uid.equals(((Number) assignedTo).longValue())) return;
        if (createdBy != null && uid.equals(((Number) createdBy).longValue())) return;
        throw new AccessDeniedException("You are not authorized to modify this request.");
    }

    public void authorizeClientRequestWrite(UserDetailsImpl user, Map<String, Object> request) {
        requireWrite();
        if (isAdminOrManager(user)) return;
        Object assignedTo = request.get("assigned_to");
        Object createdBy = request.get("created_by");
        Long uid = user.getId();
        if (assignedTo != null && uid.equals(((Number) assignedTo).longValue())) return;
        if (createdBy != null && uid.equals(((Number) createdBy).longValue())) return;
        throw new AccessDeniedException("You are not authorized to modify this client request.");
    }

    public void authorizeExchangeWrite(UserDetailsImpl user, Map<String, Object> exchange) {
        requireWrite();
        if (isAdminOrManager(user)) return;
        Object assignedTo = exchange.get("assigned_to");
        Object createdBy = exchange.get("created_by");
        Long uid = user.getId();
        if (assignedTo != null && uid.equals(((Number) assignedTo).longValue())) return;
        if (createdBy != null && uid.equals(((Number) createdBy).longValue())) return;
        throw new AccessDeniedException("You are not authorized to modify this exchange.");
    }

    public void authorizeBacklinkWrite(UserDetailsImpl user, Map<String, Object> backlink) {
        requireWrite();
        if (isAdminOrManager(user)) return;
        Object assignedTo = backlink.get("assigned_to");
        Object createdBy = backlink.get("created_by");
        Long uid = user.getId();
        if (assignedTo != null && uid.equals(((Number) assignedTo).longValue())) return;
        if (createdBy != null && uid.equals(((Number) createdBy).longValue())) return;
        throw new AccessDeniedException("You are not authorized to modify this backlink.");
    }

    public void authorizeFollowUpWrite(UserDetailsImpl user, Map<String, Object> followUp) {
        requireWrite();
        if (isAdminOrManager(user)) return;
        Object assignedTo = followUp.get("assigned_to");
        Object createdBy = followUp.get("created_by");
        Long uid = user.getId();
        if (assignedTo != null && uid.equals(((Number) assignedTo).longValue())) return;
        if (createdBy != null && uid.equals(((Number) createdBy).longValue())) return;
        throw new AccessDeniedException("You are not authorized to modify this follow-up.");
    }

    public void authorizeContactWrite(UserDetailsImpl user, Map<String, Object> contact) {
        requireWrite();
        if (isAdminOrManager(user)) return;
        Object domainId = contact.get("domain_id");
        if (domainId != null) {
            List<Map<String, Object>> doms = jdbcTemplate.queryForList("SELECT assigned_to, added_by FROM domains WHERE id = ?", domainId);
            if (!doms.isEmpty()) {
                Map<String, Object> d = doms.get(0);
                Object assignedTo = d.get("assigned_to");
                Object addedBy = d.get("added_by");
                Long uid = user.getId();
                if (assignedTo != null && !uid.equals(((Number) assignedTo).longValue())) {
                    if (addedBy == null || !uid.equals(((Number) addedBy).longValue())) {
                        throw new AccessDeniedException("You are not authorized to modify contacts for this domain.");
                    }
                }
            }
        }
    }
}
