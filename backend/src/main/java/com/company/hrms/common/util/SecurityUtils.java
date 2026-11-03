package com.company.hrms.common.util;

import com.company.hrms.security.service.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.Optional;

/**
 * Tiện ích truy xuất thông tin xác thực và phân quyền (RBAC) của người dùng hiện tại
 * từ Spring SecurityContextHolder.
 */
public final class SecurityUtils {

    private SecurityUtils() {
        // Utility class
    }

    /**
     * Lấy đối tượng Authentication hiện tại từ SecurityContext.
     */
    public static Optional<Authentication> getAuthentication() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.empty();
        }
        return Optional.of(auth);
    }

    /**
     * Lấy UserPrincipal của người dùng đang đăng nhập.
     */
    public static Optional<UserPrincipal> getCurrentUserPrincipal() {
        return getAuthentication()
                .map(Authentication::getPrincipal)
                .filter(principal -> principal instanceof UserPrincipal)
                .map(principal -> (UserPrincipal) principal);
    }

    /**
     * Lấy ID tài khoản người dùng (users.id) hiện tại.
     */
    public static Optional<Long> getCurrentUserId() {
        return getCurrentUserPrincipal().map(UserPrincipal::getId);
    }

    /**
     * Lấy ID nhân viên (employees.id) liên kết với tài khoản hiện tại.
     */
    public static Optional<Long> getCurrentEmployeeId() {
        return getCurrentUserPrincipal().map(UserPrincipal::getEmployeeId);
    }

    /**
     * Kiểm tra phiên làm việc hiện tại có hợp lệ hay không.
     */
    public static boolean isAuthenticated() {
        return getAuthentication().isPresent();
    }

    /**
     * Kiểm tra xem người dùng hiện tại có vai trò Giám đốc (ROLE_DIRECTOR) hoặc Quản trị viên (ROLE_ADMIN) hay không.
     */
    public static boolean isDirectorOrAdmin() {
        return hasAnyRole("ROLE_DIRECTOR", "ROLE_ADMIN");
    }

    /**
     * Kiểm tra xem người dùng hiện tại có vai trò Quản lý chi nhánh (ROLE_MANAGER) hay không.
     */
    public static boolean isManager() {
        return hasRole("ROLE_MANAGER");
    }

    /**
     * Kiểm tra vai trò cụ thể của người dùng hiện tại.
     */
    public static boolean hasRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return false;
        }
        String formattedRole = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
        return getAuthentication()
                .map(Authentication::getAuthorities)
                .map(authorities -> authorities.stream()
                        .map(GrantedAuthority::getAuthority)
                        .anyMatch(formattedRole::equals))
                .orElse(false);
    }

    /**
     * Kiểm tra người dùng hiện tại có ít nhất một trong các vai trò được chỉ định.
     */
    public static boolean hasAnyRole(String... roleNames) {
        if (roleNames == null || roleNames.length == 0) {
            return false;
        }
        return Arrays.stream(roleNames).anyMatch(SecurityUtils::hasRole);
    }
}
