package com.company.hrms.modules.employee;

import com.company.hrms.common.service.FileStorageService;
import com.company.hrms.modules.auth.repository.RoleRepository;
import com.company.hrms.modules.auth.repository.UserRepository;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.dto.EmployeeDto;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.employee.repository.EmployeeSecondaryBranchRepository;
import com.company.hrms.modules.employee.service.EmployeeService;
import com.company.hrms.modules.position.repository.PositionRepository;
import com.company.hrms.modules.schedule.domain.Schedule;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.repository.ScheduleRepository;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import com.company.hrms.modules.shift.domain.WorkShift;
import com.company.hrms.modules.shift.repository.WorkShiftRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeeBranchTransferTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private PositionRepository positionRepository;

    @Mock
    private ShiftAssignmentRepository assignmentRepository;

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private WorkShiftRepository workShiftRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmployeeSecondaryBranchRepository secondaryBranchRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private com.company.hrms.modules.availability.repository.EmployeeAvailabilityRepository availabilityRepository;

    @Mock
    private com.company.hrms.modules.availability.repository.EmployeePreferredShiftRepository preferredShiftRepository;

    @InjectMocks
    private EmployeeService employeeService;

    private Long employeeId = 2L;
    private Long oldBranchId = 1L; // Cầu Giấy
    private Long newBranchId = 2L; // Đống Đa

    @Test
    @DisplayName("migrateEmployeeShiftsToNewBranch remaps future assignments to new branch schedule and work shifts")
    void testMigrateEmployeeShiftsToNewBranch() {
        LocalDate currentMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate workDate = currentMonday.plusDays(2); // Thứ Tư

        // 1. Phân ca cũ tại chi nhánh Cầu Giấy
        ShiftAssignment oldAssignment = new ShiftAssignment();
        oldAssignment.setId(101L);
        oldAssignment.setEmployeeId(employeeId);
        oldAssignment.setScheduleId(5L);
        oldAssignment.setWorkShiftId(1L);
        oldAssignment.setWorkDate(workDate);
        oldAssignment.setSnapshotShiftName("Ca Sáng");
        oldAssignment.setSnapshotStartTime(LocalTime.of(9, 0));
        oldAssignment.setSnapshotEndTime(LocalTime.of(12, 0));
        oldAssignment.setStatus("ASSIGNED");

        Schedule oldSchedule = new Schedule();
        oldSchedule.setId(5L);
        oldSchedule.setBranchId(oldBranchId);
        oldSchedule.setStartDate(currentMonday);
        oldSchedule.setEndDate(currentMonday.plusDays(6));

        // 2. Mẫu ca mới tại chi nhánh Đống Đa
        WorkShift newBranchShift = new WorkShift();
        newBranchShift.setId(55L);
        newBranchShift.setShiftCode("CA_SANG");
        newBranchShift.setShiftName("Ca Sáng");
        newBranchShift.setBranchId(newBranchId);
        newBranchShift.setStartTime(LocalTime.of(8, 0));
        newBranchShift.setEndTime(LocalTime.of(13, 0));
        newBranchShift.setBreakMinutes(30);
        newBranchShift.setIsCrossMidnight(false);
        newBranchShift.setColorCode("#10B981");

        Schedule targetSchedule = new Schedule();
        targetSchedule.setId(18L);
        targetSchedule.setBranchId(newBranchId);
        targetSchedule.setStartDate(currentMonday);
        targetSchedule.setEndDate(currentMonday.plusDays(6));

        // Mocking
        when(assignmentRepository.findAllByEmployeeIdAndWorkDateBetween(eq(employeeId), eq(currentMonday), any()))
                .thenReturn(List.of(oldAssignment));
        when(workShiftRepository.findAllByBranchIdAndDeletedAtIsNullOrderByStartTimeAsc(newBranchId))
                .thenReturn(List.of(newBranchShift));
        when(scheduleRepository.findById(5L)).thenReturn(Optional.of(oldSchedule));
        when(scheduleRepository.findByBranchIdAndStartDate(newBranchId, currentMonday))
                .thenReturn(Optional.of(targetSchedule));

        // Thực hiện chuyển ca
        employeeService.migrateEmployeeShiftsToNewBranch(employeeId, oldBranchId, newBranchId);

        // Kiểm tra kết quả
        assertEquals(18L, oldAssignment.getScheduleId(), "Schedule ID phải chuyển sang Schedule chi nhánh mới (18)");
        assertEquals(55L, oldAssignment.getWorkShiftId(), "Work Shift ID phải chuyển sang Ca Sáng chi nhánh mới (55)");
        assertEquals("Ca Sáng", oldAssignment.getSnapshotShiftName());
        assertEquals(LocalTime.of(8, 0), oldAssignment.getSnapshotStartTime());
        assertEquals(LocalTime.of(13, 0), oldAssignment.getSnapshotEndTime());
        assertEquals(LocalDateTime.of(workDate, LocalTime.of(8, 0)), oldAssignment.getPlannedStartTime());

        verify(assignmentRepository, times(1)).save(oldAssignment);
    }

    @Test
    @DisplayName("updateEmployee remaps availabilities when branchId changes")
    void testUpdateEmployeeRemapsAvailabilities() {
        Employee existingEmployee = new Employee();
        existingEmployee.setId(employeeId);
        existingEmployee.setEmployeeCode("EMP-002");
        existingEmployee.setEmail("tai.nguyen@company.com");
        existingEmployee.setBranchId(oldBranchId);
        existingEmployee.setPositionId(3L);
        existingEmployee.setVersion(1);

        EmployeeDto updateRequest = new EmployeeDto();
        updateRequest.setId(employeeId);
        updateRequest.setEmployeeCode("EMP-002");
        updateRequest.setEmail("tai.nguyen@company.com");
        updateRequest.setBranchId(newBranchId); // Đổi sang chi nhánh 2
        updateRequest.setPositionId(3L);
        updateRequest.setVersion(1);

        // Mẫu ca cũ chi nhánh 1
        WorkShift oldWs = new WorkShift();
        oldWs.setId(3L);
        oldWs.setShiftCode("CA_DEM");
        oldWs.setShiftName("Ca Đêm");
        oldWs.setBranchId(oldBranchId);

        // Mẫu ca mới chi nhánh 2
        WorkShift newWs = new WorkShift();
        newWs.setId(8L);
        newWs.setShiftCode("CA_DEM");
        newWs.setShiftName("Ca Đêm");
        newWs.setBranchId(newBranchId);

        com.company.hrms.modules.availability.domain.EmployeeAvailability oldAvail =
                new com.company.hrms.modules.availability.domain.EmployeeAvailability(employeeId, 3L, (byte) 2, true);

        when(employeeRepository.findByIdAndDeletedAtIsNull(employeeId)).thenReturn(Optional.of(existingEmployee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(workShiftRepository.findAllByBranchIdAndDeletedAtIsNullOrderByStartTimeAsc(newBranchId))
                .thenReturn(List.of(newWs));
        when(workShiftRepository.findById(3L)).thenReturn(Optional.of(oldWs));
        when(availabilityRepository.findAllByEmployeeIdAndBranchId(employeeId, oldBranchId))
                .thenReturn(List.of(oldAvail));
        when(availabilityRepository.findAllByEmployeeIdAndBranchId(employeeId, newBranchId))
                .thenReturn(List.of());
        when(preferredShiftRepository.findAllByEmployeeIdAndBranchId(employeeId, oldBranchId))
                .thenReturn(List.of());
        when(preferredShiftRepository.findAllByEmployeeIdAndBranchId(employeeId, newBranchId))
                .thenReturn(List.of());
        when(assignmentRepository.findAllByEmployeeIdAndWorkDateBetween(eq(employeeId), any(), any()))
                .thenReturn(List.of());

        // Update
        employeeService.updateEmployee(employeeId, updateRequest);

        // Verify
        assertEquals(8L, oldAvail.getWorkShiftId(), "work_shift_id của lịch khả dụng phải được chuyển từ 3 sang 8");
        verify(availabilityRepository, times(1)).save(oldAvail);
    }
}
