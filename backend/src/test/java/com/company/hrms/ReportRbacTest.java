package com.company.hrms;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.auth.domain.Role;
import com.company.hrms.modules.auth.domain.User;
import com.company.hrms.modules.auth.dto.AuthResponse;
import com.company.hrms.modules.auth.dto.LoginRequest;
import com.company.hrms.modules.auth.repository.RoleRepository;
import com.company.hrms.modules.auth.repository.UserRepository;
import com.company.hrms.modules.auth.service.AuthService;
import com.company.hrms.modules.branch.domain.Branch;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.report.controller.ReportController;
import com.company.hrms.modules.report.dto.AttendanceSummaryDto;
import com.company.hrms.security.service.CustomUserDetailsService;
import com.company.hrms.security.service.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
public class ReportRbacTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private ReportController reportController;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @BeforeEach
    void setUp() {
        Branch branch1 = branchRepository.findById(1L).orElseGet(() -> {
            Branch b = new Branch();
            b.setId(1L);
            b.setBranchCode("CN_CAUGIAY");
            b.setBranchName("Chi nhánh Cầu Giấy");
            b.setIsActive(true);
            return branchRepository.save(b);
        });
        if (!"Chi nhánh Cầu Giấy".equals(branch1.getBranchName())) {
            branch1.setBranchName("Chi nhánh Cầu Giấy");
            branchRepository.save(branch1);
        }

        Branch branch2 = branchRepository.findById(2L).orElseGet(() -> {
            Branch b = new Branch();
            b.setId(2L);
            b.setBranchCode("CN_DONGDA");
            b.setBranchName("Chi nhánh Đống Đa");
            b.setIsActive(true);
            return branchRepository.save(b);
        });
        if (!"Chi nhánh Đống Đa".equals(branch2.getBranchName())) {
            branch2.setBranchName("Chi nhánh Đống Đa");
            branchRepository.save(branch2);
        }

        Role roleManager = roleRepository.findByRoleCode("ROLE_MANAGER").orElseGet(() -> {
            Role r = new Role();
            r.setRoleCode("ROLE_MANAGER");
            r.setRoleName("Quản lý");
            return roleRepository.save(r);
        });

        Role roleDirector = roleRepository.findByRoleCode("ROLE_DIRECTOR").orElseGet(() -> {
            Role r = new Role();
            r.setRoleCode("ROLE_DIRECTOR");
            r.setRoleName("Giám đốc");
            return roleRepository.save(r);
        });

        User userEmp001 = userRepository.findByUsername("EMP-001").orElseGet(() -> {
            User u = new User();
            u.setUsername("EMP-001");
            u.setEmail("emp001@company.com");
            return u;
        });
        userEmp001.setPasswordHash(passwordEncoder.encode("emp001@123"));
        userEmp001.setIsActive(true);
        userEmp001.setDeletedAt(null);
        userEmp001.setFailedLoginAttempts(0);
        userEmp001.setRoles(new HashSet<>(List.of(roleManager)));
        userEmp001 = userRepository.save(userEmp001);

        final Long userId = userEmp001.getId();
        Employee emp001 = employeeRepository.findByEmployeeCodeAndDeletedAtIsNull("EMP-001").orElseGet(() -> {
            Employee e = new Employee();
            e.setEmployeeCode("EMP-001");
            e.setFullName("Nguyễn Thu Phương");
            return e;
        });
        emp001.setUserId(userId);
        emp001.setPositionId(2L);
        emp001.setBranchId(1L);
        emp001.setIsActive(true);
        emp001.setDeletedAt(null);
        employeeRepository.save(emp001);

        // Đảm bảo EMP-002 luôn thuộc chi nhánh 2 (Đống Đa), không bị gán nhầm
        employeeRepository.findByEmployeeCodeAndDeletedAtIsNull("EMP-002").ifPresent(e -> {
            e.setBranchId(2L);
            employeeRepository.save(e);
        });

        Employee emp021 = employeeRepository.findByEmployeeCodeAndDeletedAtIsNull("EMP-021").orElseGet(() -> {
            Employee e = new Employee();
            e.setEmployeeCode("EMP-021");
            e.setFullName("Đinh Thị Uyên");
            return e;
        });
        emp021.setPositionId(3L);
        emp021.setBranchId(2L);
        emp021.setIsActive(true);
        emp021.setDeletedAt(null);
        employeeRepository.save(emp021);

        userRepository.findByUsername("admin").ifPresent(admin -> {
            admin.setRoles(new HashSet<>(List.of(roleDirector)));
            userRepository.save(admin);
        });
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(UserPrincipal principal) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("ROLE_MANAGER Login returns branch_id and branch_name")
    void testManagerLoginReturnsBranchInfo() {
        LoginRequest req = new LoginRequest();
        req.setUsername("EMP-001");
        req.setPassword("emp001@123");

        AuthResponse res = authService.login(req);
        assertNotNull(res);
        assertNotNull(res.getAccessToken());

        AuthResponse.UserInfo user = res.getUser();
        assertNotNull(user);
        assertEquals("EMP-001", user.getUsername());
        assertTrue(user.getRoles().contains("ROLE_MANAGER"), "User should have ROLE_MANAGER");
        assertNotNull(user.getBranchId(), "branch_id must not be null for Manager");
        assertEquals(1L, user.getBranchId(), "EMP-001 must belong to branch 1 (Cầu Giấy)");
        assertEquals("Chi nhánh Cầu Giấy", user.getBranchName(), "branch_name must be Chi nhánh Cầu Giấy");
    }

    @Test
    @DisplayName("ReportController enforces Manager branch scope and blocks cross-branch access")
    void testManagerReportBranchScopeEnforcement() throws IOException {
        UserPrincipal managerPrincipal = (UserPrincipal) userDetailsService.loadUserByUsername("EMP-001");
        assertNotNull(managerPrincipal);
        assertEquals("EMP-001", managerPrincipal.getUsername());
        assertTrue(managerPrincipal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER")));

        authenticateAs(managerPrincipal);

        // Case 1: Manager requests without branch_id -> auto-scoped to branch 1
        ApiResponse<List<AttendanceSummaryDto>> responseNoBranch = reportController.getAttendanceSummary(
                managerPrincipal, null, 2026, 10
        );
        assertNotNull(responseNoBranch);
        assertNotNull(responseNoBranch.getData());
        assertFalse(responseNoBranch.getData().isEmpty(), "Should return branch 1 attendance summaries");
        for (AttendanceSummaryDto dto : responseNoBranch.getData()) {
            assertEquals("Chi nhánh Cầu Giấy", dto.getBranchName(), "All returned records must belong to manager branch 1 (Cầu Giấy)");
            assertNotEquals("EMP-021", dto.getEmployeeCode(), "EMP-021 (Đống Đa) must NOT appear in manager report");

            Employee emp = employeeRepository.findById(dto.getEmployeeId()).orElse(null);
            assertNotNull(emp);
            assertEquals(1L, emp.getBranchId());
        }

        // Case 2: Manager attempts to request branch 2 -> controller MUST override to branch 1
        ApiResponse<List<AttendanceSummaryDto>> responseAttemptBranch2 = reportController.getAttendanceSummary(
                managerPrincipal, 2L, 2026, 10
        );
        assertNotNull(responseAttemptBranch2);
        assertFalse(responseAttemptBranch2.getData().isEmpty());
        for (AttendanceSummaryDto dto : responseAttemptBranch2.getData()) {
            assertEquals("Chi nhánh Cầu Giấy", dto.getBranchName(), "Effective branch must be forced to manager branch 1, ignoring request param 2");
            assertNotEquals("EMP-021", dto.getEmployeeCode());
        }

        // Case 3: Excel export enforces manager branch
        ResponseEntity<byte[]> excelRes = reportController.exportExcel(managerPrincipal, 2L, 2026, 10);
        assertNotNull(excelRes);
        assertNotNull(excelRes.getBody());
        assertTrue(excelRes.getBody().length > 0, "Excel export must return valid bytes");

        // Case 4: CSV export enforces manager branch
        ResponseEntity<byte[]> csvRes = reportController.exportCsv(managerPrincipal, 2L, 2026, 10);
        assertNotNull(csvRes);
        assertNotNull(csvRes.getBody());
        assertTrue(csvRes.getBody().length > 0, "CSV export must return valid bytes");
    }

    @Test
    @DisplayName("ROLE_DIRECTOR retains full access across all branches")
    void testDirectorFullAccessPreserved() {
        UserPrincipal directorPrincipal = (UserPrincipal) userDetailsService.loadUserByUsername("admin");
        assertNotNull(directorPrincipal);
        assertTrue(directorPrincipal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DIRECTOR")));

        authenticateAs(directorPrincipal);

        // Case 1: Director requests all branches (branch_id = null)
        ApiResponse<List<AttendanceSummaryDto>> allBranches = reportController.getAttendanceSummary(
                directorPrincipal, null, 2026, 10
        );
        assertNotNull(allBranches);
        assertNotNull(allBranches.getData());

        boolean hasCGI = allBranches.getData().stream().anyMatch(d -> "Chi nhánh Cầu Giấy".equals(d.getBranchName()));
        assertTrue(hasCGI, "Director view should contain Chi nhánh Cầu Giấy");

        // Case 2: Director explicitly filters by branch 1
        ApiResponse<List<AttendanceSummaryDto>> branch1Only = reportController.getAttendanceSummary(
                directorPrincipal, 1L, 2026, 10
        );
        assertNotNull(branch1Only);
        for (AttendanceSummaryDto dto : branch1Only.getData()) {
            assertEquals("Chi nhánh Cầu Giấy", dto.getBranchName(), "Director filtered by branch 1 should only return Cầu Giấy");
        }

        // Case 3: Director explicitly filters by branch 2
        ApiResponse<List<AttendanceSummaryDto>> branch2Only = reportController.getAttendanceSummary(
                directorPrincipal, 2L, 2026, 10
        );
        assertNotNull(branch2Only);
        for (AttendanceSummaryDto dto : branch2Only.getData()) {
            assertEquals("Chi nhánh Đống Đa", dto.getBranchName(), "Director filtered by branch 2 should only return Đống Đa");
        }
    }
}
