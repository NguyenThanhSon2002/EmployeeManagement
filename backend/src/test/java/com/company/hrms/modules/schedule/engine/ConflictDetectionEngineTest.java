package com.company.hrms.modules.schedule.engine;

import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.leave.domain.LeaveRequest;
import com.company.hrms.modules.schedule.domain.CompanyHoliday;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.engine.rule.*;
import com.company.hrms.modules.shift.domain.WorkShift;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ConflictDetectionEngineTest {

    private ShiftOverlapRule shiftOverlapRule;
    private EmployeeStatusRule employeeStatusRule;
    private ApprovedLeaveOverlapRule approvedLeaveOverlapRule;
    private MinRestPeriodRule minRestPeriodRule;
    private HolidayAssignmentRule holidayAssignmentRule;
    private DailyMaxHoursRule dailyMaxHoursRule;
    private WeeklyMaxHoursRule weeklyMaxHoursRule;

    @BeforeEach
    void setUp() {
        shiftOverlapRule = new ShiftOverlapRule();
        employeeStatusRule = new EmployeeStatusRule();
        approvedLeaveOverlapRule = new ApprovedLeaveOverlapRule();
        minRestPeriodRule = new MinRestPeriodRule();
        holidayAssignmentRule = new HolidayAssignmentRule();
        dailyMaxHoursRule = new DailyMaxHoursRule();
        weeklyMaxHoursRule = new WeeklyMaxHoursRule();
    }

    @Test
    void testShiftOverlapRule_MandatoryError() {
        LocalDate workDate = LocalDate.of(2026, 10, 15);
        Long empId = 1L;

        // Existing assignment: 08:00 - 16:00
        ShiftAssignment existing = new ShiftAssignment();
        existing.setId(100L);
        existing.setEmployeeId(empId);
        existing.setWorkDate(workDate);
        existing.setSnapshotShiftName("Ca Sáng");
        existing.setSnapshotStartTime(LocalTime.of(8, 0));
        existing.setSnapshotEndTime(LocalTime.of(16, 0));
        existing.setPlannedStartTime(LocalDateTime.of(workDate, LocalTime.of(8, 0)));
        existing.setPlannedEndTime(LocalDateTime.of(workDate, LocalTime.of(16, 0)));
        existing.setStatus("ASSIGNED");

        // Candidate assignment: 15:00 - 23:00 (overlaps from 15:00 to 16:00)
        LocalDateTime plannedStart = LocalDateTime.of(workDate, LocalTime.of(15, 0));
        LocalDateTime plannedEnd = LocalDateTime.of(workDate, LocalTime.of(23, 0));

        ConflictDetectionContext context = new ConflictDetectionContext(
                empId, workDate, 2L, null, plannedStart, plannedEnd, null,
                null, List.of(existing), null, null, null
        );

        ConflictValidationResult result = new ConflictValidationResult();
        shiftOverlapRule.evaluate(context, result);

        assertThat(result.getHasMandatoryErrors()).isTrue();
        assertThat(result.getMandatoryErrors()).hasSize(1);
        assertThat(result.getMandatoryErrors().get(0).getRuleCode()).isEqualTo("ERR_SHIFT_OVERLAP");
    }

    @Test
    void testEmployeeStatusRule_ResignedEmployee() {
        LocalDate workDate = LocalDate.of(2026, 10, 15);
        Employee emp = new Employee();
        emp.setId(1L);
        emp.setFullName("Nguyễn Văn Đã Nghỉ");
        emp.setEmploymentStatus("RESIGNED");
        emp.setIsActive(false);

        ConflictDetectionContext context = new ConflictDetectionContext(
                1L, workDate, 1L, null,
                LocalDateTime.of(workDate, LocalTime.of(8, 0)),
                LocalDateTime.of(workDate, LocalTime.of(17, 0)),
                null, emp, null, null, null, null
        );

        ConflictValidationResult result = new ConflictValidationResult();
        employeeStatusRule.evaluate(context, result);

        assertThat(result.getHasMandatoryErrors()).isTrue();
        assertThat(result.getMandatoryErrors().get(0).getRuleCode()).isEqualTo("ERR_INVALID_EMPLOYEE_STATUS");
    }

    @Test
    void testApprovedLeaveOverlapRule_Warning() {
        LocalDate workDate = LocalDate.of(2026, 10, 15);
        LeaveRequest leave = new LeaveRequest();
        leave.setEmployeeId(1L);
        leave.setStartDate(LocalDate.of(2026, 10, 14));
        leave.setEndDate(LocalDate.of(2026, 10, 16));
        leave.setStatus("APPROVED");

        ConflictDetectionContext context = new ConflictDetectionContext(
                1L, workDate, 1L, null,
                LocalDateTime.of(workDate, LocalTime.of(8, 0)),
                LocalDateTime.of(workDate, LocalTime.of(17, 0)),
                null, null, null, List.of(leave), null, null
        );

        ConflictValidationResult result = new ConflictValidationResult();
        approvedLeaveOverlapRule.evaluate(context, result);

        assertThat(result.getHasWarnings()).isTrue();
        assertThat(result.getWarnings().get(0).getRuleCode()).isEqualTo("WARN_LEAVE_CONFLICT");
    }

    @Test
    void testMinRestPeriodRule_InsufficientRest() {
        LocalDate monday = LocalDate.of(2026, 10, 12);
        LocalDate tuesday = LocalDate.of(2026, 10, 13);
        Long empId = 1L;

        // Monday evening shift: 14:00 - 22:00
        ShiftAssignment mondayShift = new ShiftAssignment();
        mondayShift.setId(101L);
        mondayShift.setEmployeeId(empId);
        mondayShift.setWorkDate(monday);
        mondayShift.setSnapshotShiftName("Ca Chiều");
        mondayShift.setSnapshotStartTime(LocalTime.of(14, 0));
        mondayShift.setSnapshotEndTime(LocalTime.of(22, 0));
        mondayShift.setPlannedStartTime(LocalDateTime.of(monday, LocalTime.of(14, 0)));
        mondayShift.setPlannedEndTime(LocalDateTime.of(monday, LocalTime.of(22, 0)));
        mondayShift.setStatus("ASSIGNED");

        // Tuesday morning candidate: 06:00 - 14:00 (rest between 22:00 and 06:00 is 8.0h < 11.0h)
        LocalDateTime tuesdayStart = LocalDateTime.of(tuesday, LocalTime.of(6, 0));
        LocalDateTime tuesdayEnd = LocalDateTime.of(tuesday, LocalTime.of(14, 0));

        ConflictDetectionContext context = new ConflictDetectionContext(
                empId, tuesday, 1L, null, tuesdayStart, tuesdayEnd, null,
                null, List.of(mondayShift), null, null, null
        );
        context.setMinRestHours(11.0);

        ConflictValidationResult result = new ConflictValidationResult();
        minRestPeriodRule.evaluate(context, result);

        assertThat(result.getHasWarnings()).isTrue();
        assertThat(result.getWarnings().get(0).getRuleCode()).isEqualTo("WARN_INSUFFICIENT_REST_TIME");
    }

    @Test
    void testHolidayAssignmentRule_Warning() {
        LocalDate holidayDate = LocalDate.of(2026, 1, 1);
        CompanyHoliday holiday = new CompanyHoliday(holidayDate, "Tết Dương Lịch", true, true);

        ConflictDetectionContext context = new ConflictDetectionContext(
                1L, holidayDate, 1L, null,
                LocalDateTime.of(holidayDate, LocalTime.of(8, 0)),
                LocalDateTime.of(holidayDate, LocalTime.of(17, 0)),
                null, null, null, null, List.of(holiday), null
        );

        ConflictValidationResult result = new ConflictValidationResult();
        holidayAssignmentRule.evaluate(context, result);

        assertThat(result.getHasWarnings()).isTrue();
        assertThat(result.getWarnings().get(0).getRuleCode()).isEqualTo("WARN_HOLIDAY_ASSIGNMENT");
    }
}
