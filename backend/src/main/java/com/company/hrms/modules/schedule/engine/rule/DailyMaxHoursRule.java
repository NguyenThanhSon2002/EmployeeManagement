package com.company.hrms.modules.schedule.engine.rule;

import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;
import com.company.hrms.modules.schedule.engine.ConflictDetectionContext;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class DailyMaxHoursRule implements ConflictRule {

    @Override
    public void evaluate(ConflictDetectionContext context, ConflictValidationResult result) {
        if (context.getPlannedStartTime() == null || context.getPlannedEndTime() == null) {
            return;
        }

        // 1. Candidate shift hours
        int breakMin = context.getWorkShift() != null && context.getWorkShift().getBreakMinutes() != null
                ? context.getWorkShift().getBreakMinutes()
                : 0;
        long candidateMinutes = Math.max(0, Duration.between(context.getPlannedStartTime(), context.getPlannedEndTime()).toMinutes() - breakMin);

        // 2. Existing assignments on the same workDate for this employee
        long totalMinutes = candidateMinutes;
        for (ShiftAssignment existing : context.getExistingAssignments()) {
            if ("CANCELLED".equalsIgnoreCase(existing.getStatus())) {
                continue;
            }
            if (context.getExcludeAssignmentId() != null && context.getExcludeAssignmentId().equals(existing.getId())) {
                continue;
            }
            if (context.getEmployeeId().equals(existing.getEmployeeId()) && context.getWorkDate().equals(existing.getWorkDate())) {
                int existBreak = existing.getSnapshotBreakMinutes() != null ? existing.getSnapshotBreakMinutes() : 0;
                long mins = Math.max(0, Duration.between(existing.getPlannedStartTime(), existing.getPlannedEndTime()).toMinutes() - existBreak);
                totalMinutes += mins;
            }
        }

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
