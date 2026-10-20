package com.company.hrms;

import com.company.hrms.common.response.ApiResponse;
import com.company.hrms.modules.auth.dto.AuthResponse;
import com.company.hrms.modules.auth.dto.LoginRequest;
import com.company.hrms.modules.auth.service.AuthService;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.report.controller.ReportController;
import com.company.hrms.modules.report.dto.AttendanceSummaryDto;
import com.company.hrms.security.service.CustomUserDetailsService;
import com.company.hrms.security.service.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
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
    private CustomUserDetailsService userDetailsService;

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
        req.setUsername("EMP-002");
        req.setPassword("emp002@123");

        AuthResponse res = authService.login(req);
        assertNotNull(res);
        assertNotNull(res.getAccessToken());

        AuthResponse.UserInfo user = res.getUser();
        assertNotNull(user);
        assertEquals("EMP-002", user.getUsername());
        assertTrue(user.getRoles().contains("ROLE_MANAGER"), "User should have ROLE_MANAGER");
        assertNotNull(user.getBranchId(), "branch_id must not be null for Manager");
        assertEquals(1L, user.getBranchId(), "EMP-002 must belong to branch 1 (Cầu Giấy)");
        assertEquals("Chi nhánh Cầu Giấy", user.getBranchName(), "branch_name must be Chi nhánh Cầu Giấy");
    }

    @Test
    @DisplayName("ReportController enforces Manager branch scope and blocks cross-branch access")
    void testManagerReportBranchScopeEnforcement() throws IOException {
        UserPrincipal managerPrincipal = (UserPrincipal) userDetailsService.loadUserByUsername("EMP-002");
        assertNotNull(managerPrincipal);
        assertEquals("EMP-002", managerPrincipal.getUsername());
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
