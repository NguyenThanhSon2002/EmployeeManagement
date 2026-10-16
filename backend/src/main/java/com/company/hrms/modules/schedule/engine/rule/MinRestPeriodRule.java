package com.company.hrms.modules.schedule.engine.rule;

import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;
import com.company.hrms.modules.schedule.engine.ConflictDetectionContext;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class MinRestPeriodRule implements ConflictRule {

    @Override
    public void evaluate(ConflictDetectionContext context, ConflictValidationResult result) {
        if (context.getPlannedStartTime() == null || context.getPlannedEndTime() == null) {
            return;
        }

        ShiftAssignment latestBefore = null;
        ShiftAssignment earliestAfter = null;

        for (ShiftAssignment existing : context.getExistingAssignments()) {
            if ("CANCELLED".equalsIgnoreCase(existing.getStatus())) {
                continue;
            }
            if (context.getExcludeAssignmentId() != null && context.getExcludeAssignmentId().equals(existing.getId())) {
                continue;
            }
            if (!context.getEmployeeId().equals(existing.getEmployeeId())) {
                continue;
            }

            // Check if existing ends before candidate starts
            if (!existing.getPlannedEndTime().isAfter(context.getPlannedStartTime())) {
                if (latestBefore == null || existing.getPlannedEndTime().isAfter(latestBefore.getPlannedEndTime())) {
                    latestBefore = existing;
                }
            }

            // Check if existing starts after candidate ends
            if (!existing.getPlannedStartTime().isBefore(context.getPlannedEndTime())) {
                if (earliestAfter == null || existing.getPlannedStartTime().isBefore(earliestAfter.getPlannedStartTime())) {
                    earliestAfter = existing;
                }
            }
        }

        String empName = context.getEmployee() != null ? context.getEmployee().getFullName() : "Nhân viên #" + context.getEmployeeId();

        // 1. Check rest with latest shift before
        if (latestBefore != null) {
            double restHours = Duration.between(latestBefore.getPlannedEndTime(), context.getPlannedStartTime()).toMinutes() / 60.0;
            if (restHours < context.getMinRestHours()) {
                String msg = String.format("Khoảng cách nghỉ ngơi giữa 2 ca liên tiếp là %.1f giờ (dưới mức tối thiểu %.1f giờ quy định).",
                        restHours, context.getMinRestHours());

                result.addWarning(new ScheduleConflictDto(
                        "WARN_INSUFFICIENT_REST_TIME",
                        "WARNING",
                        context.getEmployeeId(),
                        empName,
                        context.getWorkDate(),
                        context.getWorkShiftId(),
                        msg
                ));
                return; // One rest warning is sufficient
            }
        }

        // 2. Check rest with earliest shift after
        if (earliestAfter != null) {
            double restHours = Duration.between(context.getPlannedEndTime(), earliestAfter.getPlannedStartTime()).toMinutes() / 60.0;
            if (restHours < context.getMinRestHours()) {
                String msg = String.format("Khoảng cách nghỉ ngơi giữa 2 ca liên tiếp là %.1f giờ (dưới mức tối thiểu %.1f giờ quy định).",
                        restHours, context.getMinRestHours());

                result.addWarning(new ScheduleConflictDto(
                        "WARN_INSUFFICIENT_REST_TIME",
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
}
