package com.company.hrms.modules.employee.runner;

import com.company.hrms.modules.auth.domain.Role;
import com.company.hrms.modules.auth.domain.User;
import com.company.hrms.modules.auth.repository.RoleRepository;
import com.company.hrms.modules.auth.repository.UserRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.employee.service.EmployeeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Runner tự phục hồi (Self-healing Provisioning Runner):
 * Khi hệ thống khởi động, quét toàn bộ bảng nhân viên (employees).
 * Bất kỳ nhân viên nào chưa có tài khoản người dùng liên kết (user_id IS NULL)
 * hoặc tài khoản chưa khớp, hệ thống tự động sinh User với:
 * - username: Mã nhân viên (ví dụ: EMP-001)
 * - password: Mã nhân viên viết thường bỏ dấu gạch + @123 (ví dụ: emp001@123)
 * - role: Tương ứng chức danh (Giám đốc, Quản lý, Nhân viên)
 */
@Component
public class EmployeeUserProvisioningRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EmployeeUserProvisioningRunner.class);

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeUserProvisioningRunner(
            EmployeeRepository employeeRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<Employee> allEmployees = employeeRepository.findAll();
        int provisionedCount = 0;

        for (Employee emp : allEmployees) {
            if (emp.getDeletedAt() != null) {
                continue;
            }

            String empCode = emp.getEmployeeCode() != null ? emp.getEmployeeCode().trim() : null;
            if (empCode == null || empCode.isBlank()) {
                continue;
            }

            try {
                if (provisionEmployeeUser(emp, empCode)) {
                    provisionedCount++;
                }
            } catch (Exception ex) {
                log.error("[SelfHealing] Lỗi khi cấp phát tài khoản cho nhân sự {}: {}", empCode, ex.getMessage(), ex);
            }
        }

        if (provisionedCount > 0) {
            log.info("[SelfHealing] Hoàn tất rà soát & cấp phát tài khoản cho {} nhân sự.", provisionedCount);
        }
    }

    @Transactional
    public boolean provisionEmployeeUser(Employee emp, String empCode) {
        boolean needsLink = (emp.getUserId() == null);
        User user = null;

        if (emp.getUserId() != null) {
            user = userRepository.findById(emp.getUserId()).orElse(null);
            if (user == null) {
                needsLink = true;
            }
        }

        if (!needsLink && user != null) {
            String expectedRoleCode = EmployeeService.resolveRoleCode(emp.getPositionId());
            boolean isExactRoleMatch = user.getRoles().size() == 1 &&
                    user.getRoles().stream().anyMatch(r -> expectedRoleCode.equals(r.getRoleCode()));
            if (!isExactRoleMatch) {
                Role role = roleRepository.findByRoleCode(expectedRoleCode)
                        .or(() -> roleRepository.findByRoleCode("ROLE_EMPLOYEE"))
                        .orElse(null);
                if (role != null) {
                    Set<Role> roles = new HashSet<>();
                    roles.add(role);
                    user.setRoles(roles);
                    userRepository.save(user);
                    log.info("[SelfHealing] Đã tự động đồng bộ vai trò duy nhất {} cho nhân sự: {}", expectedRoleCode, empCode);
                    return true;
                }
            }
            return false;
        }

        if (!needsLink) {
            return false;
        }

        user = userRepository.findByUsername(empCode).orElse(null);
        if (user == null) {
            user = new User();
            user.setUsername(empCode);
            user.setEmail(emp.getEmail() != null ? emp.getEmail().trim() : empCode.toLowerCase() + "@company.com");
            String defaultPassword = EmployeeService.deriveDefaultPassword(empCode);
            user.setPasswordHash(passwordEncoder.encode(defaultPassword));
            user.setMustChangePassword(false);
            user.setIsActive(emp.getIsActive() != null ? emp.getIsActive() : true);
            user.setFailedLoginAttempts(0);

            // Resolve Role using canonical helper
            String roleCode = EmployeeService.resolveRoleCode(emp.getPositionId());
            Role role = roleRepository.findByRoleCode(roleCode)
                    .or(() -> roleRepository.findByRoleCode("ROLE_EMPLOYEE"))
                    .orElse(null);
            if (role != null) {
                Set<Role> roles = new HashSet<>();
                roles.add(role);
                user.setRoles(roles);
            }

            user = userRepository.save(user);
            log.info("[SelfHealing] Đã tự động tạo tài khoản User cho nhân viên: {} ({})", empCode, roleCode);
        }

        emp.setUserId(user.getId());
        employeeRepository.save(emp);
        return true;
    }
}
