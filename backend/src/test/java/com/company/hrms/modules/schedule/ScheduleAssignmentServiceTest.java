package com.company.hrms.modules.schedule;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.employee.repository.EmployeeSecondaryBranchRepository;
import com.company.hrms.modules.schedule.domain.Schedule;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.AssignSingleShiftRequest;
import com.company.hrms.modules.schedule.dto.ClaimShiftRequest;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;
import com.company.hrms.modules.schedule.dto.ShiftAssignmentDto;
import com.company.hrms.modules.schedule.engine.ConflictDetectionEngine;
import com.company.hrms.modules.schedule.repository.ScheduleChangeHistoryRepository;
import com.company.hrms.modules.schedule.repository.ScheduleRepository;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import com.company.hrms.modules.schedule.service.ScheduleAssignmentService;
import com.company.hrms.modules.shift.domain.WorkShift;
import com.company.hrms.modules.shift.repository.WorkShiftRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ScheduleAssignmentServiceTest {

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private ShiftAssignmentRepository assignmentRepository;

    @Mock
    private ScheduleChangeHistoryRepository historyRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EmployeeSecondaryBranchRepository secondaryBranchRepository;

    @Mock
    private WorkShiftRepository workShiftRepository;

    @Mock
    private ConflictDetectionEngine conflictEngine;

    @InjectMocks
    private ScheduleAssignmentService scheduleAssignmentService;

    private Schedule draftSchedule;
    private Schedule publishedSchedule;
    private WorkShift sampleShift;
    private Employee standardEmployee;
    private Employee directorEmployee;

    @BeforeEach
    void setUp() {
        draftSchedule = new Schedule(1L, LocalDate.of(2026, 11, 2), LocalDate.of(2026, 11, 8));
        draftSchedule.setId(10L);
        draftSchedule.setStatus("DRAFT");
        draftSchedule.setVersion(1);

        publishedSchedule = new Schedule(1L, LocalDate.of(2026, 11, 2), LocalDate.of(2026, 11, 8));
        publishedSchedule.setId(20L);
        publishedSchedule.setStatus("PUBLISHED");
        publishedSchedule.setVersion(1);

        sampleShift = new WorkShift();
        sampleShift.setId(100L);
        sampleShift.setShiftName("Ca Sáng");
        sampleShift.setBranchId(1L);
        sampleShift.setStartTime(LocalTime.of(8, 0));
        sampleShift.setEndTime(LocalTime.of(16, 0));
        sampleShift.setBreakMinutes(60);
        sampleShift.setIsCrossMidnight(false);
        sampleShift.setMinStaffing(1);
        sampleShift.setMaxStaffing(2);

        standardEmployee = new Employee();
        standardEmployee.setId(5L);
        standardEmployee.setFullName("Nguyễn Văn A");
        standardEmployee.setBranchId(1L);
        standardEmployee.setPositionId(3L); // Nhân viên thông thường

        directorEmployee = new Employee();
        directorEmployee.setId(1L);
        directorEmployee.setFullName("Trần Giám Đốc");
        directorEmployee.setBranchId(1L);
        directorEmployee.setPositionId(1L); // Giám đốc
    }

    @Test
    @DisplayName("Gán ca thành công khi lịch nháp, không có xung đột và nhân viên hợp lệ")
    void testAssignSingleShift_Success() {
        AssignSingleShiftRequest req = new AssignSingleShiftRequest();
        req.setScheduleId(10L);
        req.setEmployeeId(5L);
        req.setWorkShiftId(100L);
        req.setWorkDate(LocalDate.of(2026, 11, 3));

        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(draftSchedule));
        when(workShiftRepository.findByIdAndDeletedAtIsNull(100L)).thenReturn(Optional.of(sampleShift));
        when(employeeRepository.findById(5L)).thenReturn(Optional.of(standardEmployee));
        when(conflictEngine.validateAssignment(eq(5L), eq(100L), eq(LocalDate.of(2026, 11, 3)), isNull(), eq(10L), eq(1L)))
                .thenReturn(new ConflictValidationResult());

        ShiftAssignment savedEntity = new ShiftAssignment();
        savedEntity.setId(500L);
        savedEntity.setScheduleId(10L);
        savedEntity.setEmployeeId(5L);
        savedEntity.setWorkShiftId(100L);
        savedEntity.setWorkDate(LocalDate.of(2026, 11, 3));
        savedEntity.setSnapshotShiftName("Ca Sáng");
        savedEntity.setStatus("ASSIGNED");

        when(assignmentRepository.save(any(ShiftAssignment.class))).thenReturn(savedEntity);

        ShiftAssignmentDto result = scheduleAssignmentService.assignSingleShift(req, 1L);

        assertNotNull(result);
        assertEquals(500L, result.getId());
        assertEquals("ASSIGNED", result.getStatus());
        verify(assignmentRepository, times(1)).save(any(ShiftAssignment.class));
        verify(scheduleRepository, times(1)).save(draftSchedule);
        assertEquals(2, draftSchedule.getVersion());
    }

    @Test
    @DisplayName("Gán ca bị từ chối nếu nhân sự có chức danh Giám đốc (positionId = 1)")
    void testAssignSingleShift_DirectorRejected() {
        AssignSingleShiftRequest req = new AssignSingleShiftRequest();
        req.setScheduleId(10L);
        req.setEmployeeId(1L);
        req.setWorkShiftId(100L);
        req.setWorkDate(LocalDate.of(2026, 11, 3));

        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(draftSchedule));
        when(workShiftRepository.findByIdAndDeletedAtIsNull(100L)).thenReturn(Optional.of(sampleShift));
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(directorEmployee));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                scheduleAssignmentService.assignSingleShift(req, 1L));

        assertEquals("DIRECTOR_CANNOT_BE_SCHEDULED", ex.getErrorCode());
        verify(assignmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Gán ca bị từ chối nếu lịch đã PUBLISHED (SCHEDULE_LOCKED)")
    void testAssignSingleShift_ScheduleLocked() {
        AssignSingleShiftRequest req = new AssignSingleShiftRequest();
        req.setScheduleId(20L);
        req.setEmployeeId(5L);
        req.setWorkShiftId(100L);
        req.setWorkDate(LocalDate.of(2026, 11, 3));

        when(scheduleRepository.findById(20L)).thenReturn(Optional.of(publishedSchedule));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                scheduleAssignmentService.assignSingleShift(req, 1L));

        assertEquals("SCHEDULE_LOCKED", ex.getErrorCode());
        verify(assignmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Gán ca bị từ chối khi công cụ phát hiện xung đột trả về lỗi bắt buộc")
    void testAssignSingleShift_ConflictMandatoryError() {
        AssignSingleShiftRequest req = new AssignSingleShiftRequest();
        req.setScheduleId(10L);
        req.setEmployeeId(5L);
        req.setWorkShiftId(100L);
        req.setWorkDate(LocalDate.of(2026, 11, 3));

        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(draftSchedule));
        when(workShiftRepository.findByIdAndDeletedAtIsNull(100L)).thenReturn(Optional.of(sampleShift));
        when(employeeRepository.findById(5L)).thenReturn(Optional.of(standardEmployee));

        ConflictValidationResult conflictResult = new ConflictValidationResult();
        conflictResult.addMandatoryError(new ScheduleConflictDto("MANDATORY_OVERLAP", "MANDATORY", 5L, "Nguyễn Văn A", LocalDate.of(2026, 11, 3), 100L, "Ca làm việc bị trùng giờ với ca khác"));
        when(conflictEngine.validateAssignment(any(), any(), any(), any(), any(), any()))
                .thenReturn(conflictResult);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                scheduleAssignmentService.assignSingleShift(req, 1L));

        assertEquals("MANDATORY_OVERLAP", ex.getErrorCode());
        verify(assignmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đăng ký nhận ca (Claim Shift) bị từ chối khi ca đã đủ định biên nhân sự")
    void testClaimShift_ShiftFull() {
        ClaimShiftRequest req = new ClaimShiftRequest();
        req.setScheduleId(10L);
        req.setWorkShiftId(100L);
        req.setWorkDate(LocalDate.of(2026, 11, 3));

        sampleShift.setMaxStaffing(1);

        when(scheduleRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(draftSchedule));
        when(employeeRepository.findByUserIdAndDeletedAtIsNull(99L)).thenReturn(Optional.of(standardEmployee));
        when(workShiftRepository.findByIdAndDeletedAtIsNull(100L)).thenReturn(Optional.of(sampleShift));

        ShiftAssignment existing = new ShiftAssignment();
        existing.setEmployeeId(88L);
        when(assignmentRepository.findAssignmentsByShiftAndDate(10L, 100L, LocalDate.of(2026, 11, 3)))
                .thenReturn(List.of(existing));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                scheduleAssignmentService.claimShift(req, 99L));

        assertEquals("SHIFT_FULL", ex.getErrorCode());
        verify(assignmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Hủy ca tự nhận (Cancel Claimed Shift) bị từ chối khi user không phải chủ sở hữu ca")
    void testCancelClaimedShift_ForbiddenForOtherUser() {
        ShiftAssignment sa = new ShiftAssignment();
        sa.setId(300L);
        sa.setEmployeeId(5L); // Nhân viên A (ID 5)
        sa.setScheduleId(10L);

        Employee otherEmp = new Employee();
        otherEmp.setId(99L); // Nhân viên B (ID 99)

        when(assignmentRepository.findById(300L)).thenReturn(Optional.of(sa));
        when(employeeRepository.findByUserIdAndDeletedAtIsNull(123L)).thenReturn(Optional.of(otherEmp));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                scheduleAssignmentService.cancelClaimedShift(300L, 123L));

        assertEquals("FORBIDDEN", ex.getErrorCode());
        verify(assignmentRepository, never()).delete(any());
    }
}
