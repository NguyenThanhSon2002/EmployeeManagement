package com.company.hrms.modules.swap;

import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import com.company.hrms.modules.swap.domain.SwapType;
import com.company.hrms.modules.swap.dto.SimulateSwapRequest;
import com.company.hrms.modules.swap.dto.SimulateSwapResponse;
import com.company.hrms.modules.swap.service.ShiftSwapService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
public class ShiftSwapServiceTest {

    @Autowired
    private ShiftSwapService shiftSwapService;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Test
    @DisplayName("simulateSwap executes successfully for valid handover without throwing unhandled exceptions")
    void testSimulateSwapHandover() {
        LocalDate targetDate = LocalDate.of(2026, 10, 27);
        Employee emp153 = employeeRepository.findByEmployeeCodeAndDeletedAtIsNull("EMP-153").orElse(null);
        assertNotNull(emp153, "EMP-153 should exist in database");

        ShiftAssignment matchingAssignment = shiftAssignmentRepository.findAll().stream()
                .filter(a -> targetDate.equals(a.getWorkDate()) && a.getSnapshotShiftName() != null && a.getSnapshotShiftName().contains("Sáng"))
                .findFirst()
                .orElse(null);

        if (matchingAssignment == null) {
            matchingAssignment = shiftAssignmentRepository.findAll().stream()
                    .filter(a -> targetDate.equals(a.getWorkDate()))
                    .findFirst()
                    .orElse(null);
        }

        assertNotNull(matchingAssignment, "An assignment on 2026-10-27 should exist");

        SimulateSwapRequest req = new SimulateSwapRequest();
        req.setRequesterAssignmentId(matchingAssignment.getId());
        req.setTargetEmployeeId(emp153.getId());
        req.setType(SwapType.HANDOVER);

        SimulateSwapResponse response = shiftSwapService.simulateSwap(req, matchingAssignment.getEmployeeId());
        assertNotNull(response);
        assertNotNull(response.getRequesterConflicts());
        assertNotNull(response.getTargetConflicts());
    }

    @Test
    @DisplayName("createSwapRequest rejects employee requests when schedule is not PUBLISHED")
    void testCreateSwapRequestDraftScheduleBlockedByEmployee() {
        LocalDate targetDate = LocalDate.of(2026, 10, 27);
        Employee emp153 = employeeRepository.findByEmployeeCodeAndDeletedAtIsNull("EMP-153").orElse(null);
        assertNotNull(emp153);

        ShiftAssignment matchingAssignment = shiftAssignmentRepository.findAll().stream()
                .filter(a -> targetDate.equals(a.getWorkDate()))
                .findFirst()
                .orElse(null);
        assertNotNull(matchingAssignment);

        com.company.hrms.modules.swap.dto.CreateSwapRequest req = new com.company.hrms.modules.swap.dto.CreateSwapRequest();
        req.setRequesterAssignmentId(matchingAssignment.getId());
        req.setTargetEmployeeId(emp153.getId());
        req.setReason("Lý do cá nhân");

        // Khi caller là nhân viên thường (!isDirectorOrAdmin && !isManager) và schedule đang là DRAFT
        com.company.hrms.common.exception.BusinessException ex = assertThrows(
                com.company.hrms.common.exception.BusinessException.class,
                () -> shiftSwapService.createSwapRequest(req, matchingAssignment.getEmployeeId(), false, false)
        );
        assertTrue(ex.getMessage().contains("chưa được công bố") || "SCHEDULE_NOT_PUBLISHED".equals(ex.getErrorCode()));
    }
}
