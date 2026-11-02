package com.company.hrms.modules.schedule.engine.rule;

import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;
import com.company.hrms.modules.schedule.engine.ConflictDetectionContext;
import com.company.hrms.modules.schedule.engine.rule.IntervalMergeUtils.Interval;
import static com.company.hrms.modules.schedule.engine.rule.IntervalMergeUtils.calculateDeduplicatedMinutes;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class DailyMaxHoursRule implements ConflictRule {

    @Override
    public void evaluate(ConflictDetectionContext context, ConflictValidationResult result) {
        if (context.getPlannedStartTime() == null || context.getPlannedEndTime() == null) {
            return;
        }

        List<Interval> intervals = new ArrayList<>();

        // 1. Candidate shift hours
        int candidateBreak = context.getWorkShift() != null && context.getWorkShift().getBreakMinutes() != null
                ? context.getWorkShift().getBreakMinutes()
                : 0;
        intervals.add(new Interval(context.getPlannedStartTime(), context.getPlannedEndTime(), candidateBreak));

        // 2. Existing assignments on the same workDate for this employee
        for (ShiftAssignment existing : context.getExistingAssignments()) {
            if ("CANCELLED".equalsIgnoreCase(existing.getStatus())) {
                continue;
            }
            if (context.getExcludeAssignmentId() != null && context.getExcludeAssignmentId().equals(existing.getId())) {
                continue;
            }
            if (context.getEmployeeId().equals(existing.getEmployeeId()) && context.getWorkDate().equals(existing.getWorkDate())) {
                int existBreak = existing.getSnapshotBreakMinutes() != null ? existing.getSnapshotBreakMinutes() : 0;
                intervals.add(new Interval(existing.getPlannedStartTime(), existing.getPlannedEndTime(), existBreak));
            }
        }

        long totalMinutes = calculateDeduplicatedMinutes(intervals);
        double totalHours = totalMinutes / 60.0;
        if (totalHours > context.getMaxDailyHours()) {
            String empName = context.getEmployee() != null ? context.getEmployee().getFullName() : "Nhân viên #" + context.getEmployeeId();
            String msg = String.format("Tổng giờ làm trong ngày %s của nhân viên %s là %.1f giờ (vượt giới hạn quy định %.1f giờ/ngày).",
                    context.getWorkDate(), empName, totalHours, context.getMaxDailyHours());

            result.addWarning(new ScheduleConflictDto(
                    "WARN_DAILY_HOURS_EXCEEDED",
                    "WARNING",
                    context.getEmployeeId(),
                    empName,
                    context.getWorkDate(),
                    context.getWorkShiftId(),
                    msg
            ));
        }
    }
}
