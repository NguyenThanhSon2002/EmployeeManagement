package com.company.hrms.modules.schedule.engine.rule;

import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;
import com.company.hrms.modules.schedule.engine.ConflictDetectionContext;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
public class ShiftOverlapRule implements ConflictRule {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    @Override
    public void evaluate(ConflictDetectionContext context, ConflictValidationResult result) {
        if (context.getPlannedStartTime() == null || context.getPlannedEndTime() == null) {
            return;
        }

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

            // Overlap condition: max(start1, start2) < min(end1, end2)
            if (context.getPlannedStartTime().isBefore(existing.getPlannedEndTime()) &&
                    context.getPlannedEndTime().isAfter(existing.getPlannedStartTime())) {

                String empName = context.getEmployee() != null ? context.getEmployee().getFullName() : "Nhân viên #" + context.getEmployeeId();
                String msg = String.format("Không thể xếp ca: Nhân viên %s đã có ca %s (%s - %s) trùng khung giờ với ca này.",
                        empName,
                        existing.getSnapshotShiftName(),
                        existing.getSnapshotStartTime().format(TIME_FMT),
                        existing.getSnapshotEndTime().format(TIME_FMT));

                result.addMandatoryError(new ScheduleConflictDto(
                        "ERR_SHIFT_OVERLAP",
                        "MANDATORY",
                        context.getEmployeeId(),
                        empName,
                        context.getWorkDate(),
                        context.getWorkShiftId(),
                        msg
                ));
                break; // One overlap error is sufficient to block
            }
        }
    }
}
