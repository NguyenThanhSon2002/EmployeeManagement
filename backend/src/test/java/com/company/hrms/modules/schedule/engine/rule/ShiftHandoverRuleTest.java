package com.company.hrms.modules.schedule.engine.rule;

import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.engine.ConflictDetectionContext;
import com.company.hrms.modules.shift.domain.WorkShift;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ShiftHandoverRuleTest {

    private ShiftOverlapRule overlapRule;
    private DailyMaxHoursRule dailyMaxHoursRule;
    private Employee employee;

    @BeforeEach
    void setUp() {
        overlapRule = new ShiftOverlapRule();
        dailyMaxHoursRule = new DailyMaxHoursRule();
        employee = new Employee();
        employee.setId(25L);
        employee.setFullName("Nguyen Tu Duy Anh");
    }

    @Test
    void testValidHandoverShiftDoesNotTriggerMandatoryOverlapError() {
        LocalDate workDate = LocalDate.of(2026, 11, 5);
        // Existing: Ca Tối 18:00 - 23:00
        ShiftAssignment eveningShift = new ShiftAssignment();
        eveningShift.setId(101L);
        eveningShift.setEmployeeId(25L);
        eveningShift.setScheduleId(1L);
        eveningShift.setWorkDate(workDate);
        eveningShift.setPlannedStartTime(LocalDateTime.of(workDate, LocalTime.of(18, 0)));
        eveningShift.setPlannedEndTime(LocalDateTime.of(workDate, LocalTime.of(23, 0)));
        eveningShift.setSnapshotShiftName("Ca Tối");
        eveningShift.setSnapshotStartTime(LocalTime.of(18, 0));
        eveningShift.setSnapshotEndTime(LocalTime.of(23, 0));

        // Candidate: Ca Đêm 22:00 - 02:00 (+1)
        WorkShift nightShift = new WorkShift();
        nightShift.setId(7L);
        nightShift.setShiftName("Ca Đêm");
        nightShift.setBreakMinutes(0);

        LocalDateTime candStart = LocalDateTime.of(workDate, LocalTime.of(22, 0));
        LocalDateTime candEnd = LocalDateTime.of(workDate.plusDays(1), LocalTime.of(2, 0));

        ConflictDetectionContext context = new ConflictDetectionContext(
                25L,
                workDate,
                7L,
                nightShift,
                candStart,
                candEnd,
                null,
                employee,
                List.of(eveningShift),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyMap()
        );
        context.setTargetBranchId(2L);
        context.setScheduleBranchIdMap(Map.of(1L, 2L));

        ConflictValidationResult result = new ConflictValidationResult();
        overlapRule.evaluate(context, result);

        // Handover is valid -> no mandatory errors
        assertFalse(result.getHasMandatoryErrors(), "Valid handover should not produce mandatory overlap error");
        assertTrue(result.getIsValid(), "Result should be valid");
    }

    @Test
    void testExcessiveOverlapTriggersMandatoryError() {
        LocalDate workDate = LocalDate.of(2026, 11, 5);
        // Existing: Ca Tối 18:00 - 23:00
        ShiftAssignment eveningShift = new ShiftAssignment();
        eveningShift.setId(101L);
        eveningShift.setEmployeeId(25L);
        eveningShift.setScheduleId(1L);
        eveningShift.setWorkDate(workDate);
        eveningShift.setPlannedStartTime(LocalDateTime.of(workDate, LocalTime.of(18, 0)));
        eveningShift.setPlannedEndTime(LocalDateTime.of(workDate, LocalTime.of(23, 0)));
        eveningShift.setSnapshotShiftName("Ca Tối");
        eveningShift.setSnapshotStartTime(LocalTime.of(18, 0));
        eveningShift.setSnapshotEndTime(LocalTime.of(23, 0));

        // Candidate: starts at 20:00 (overlap is 3 hours > 60 mins)
        WorkShift nightShift = new WorkShift();
        nightShift.setId(7L);
        nightShift.setShiftName("Ca Đêm Sớm");
        nightShift.setBreakMinutes(0);

        LocalDateTime candStart = LocalDateTime.of(workDate, LocalTime.of(20, 0));
        LocalDateTime candEnd = LocalDateTime.of(workDate.plusDays(1), LocalTime.of(2, 0));

        ConflictDetectionContext context = new ConflictDetectionContext(
                25L,
                workDate,
                7L,
                nightShift,
                candStart,
                candEnd,
                null,
                employee,
                List.of(eveningShift),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyMap()
        );
        context.setTargetBranchId(2L);
        context.setScheduleBranchIdMap(Map.of(1L, 2L));

        ConflictValidationResult result = new ConflictValidationResult();
        overlapRule.evaluate(context, result);

        assertTrue(result.getHasMandatoryErrors(), "Overlap > 60m should produce mandatory error");
        assertEquals("ERR_SHIFT_OVERLAP", result.getMandatoryErrors().get(0).getRuleCode());
    }

    @Test
    void testIntervalMergeDeduplicatesHandoverHours() {
        LocalDate workDate = LocalDate.of(2026, 11, 5);
        List<IntervalMergeUtils.Interval> intervals = new ArrayList<>();
        // Ca Tối: 18:00 - 23:00 (5h)
        intervals.add(new IntervalMergeUtils.Interval(
                LocalDateTime.of(workDate, LocalTime.of(18, 0)),
                LocalDateTime.of(workDate, LocalTime.of(23, 0)),
                0
        ));
        // Ca Đêm: 22:00 - 02:00 (+1) (4h)
        intervals.add(new IntervalMergeUtils.Interval(
                LocalDateTime.of(workDate, LocalTime.of(22, 0)),
                LocalDateTime.of(workDate.plusDays(1), LocalTime.of(2, 0)),
                0
        ));

        long netMinutes = IntervalMergeUtils.calculateDeduplicatedMinutes(intervals);
        // 18:00 to 02:00 (+1) = 8 hours = 480 minutes (not 9h = 540m)
        assertEquals(480L, netMinutes, "Total net minutes should be 480 (8.0 hours) after interval merging");
    }
}
