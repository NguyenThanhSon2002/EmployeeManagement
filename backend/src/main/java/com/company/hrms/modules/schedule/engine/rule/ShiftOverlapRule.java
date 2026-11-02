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

                // Check if this overlap is a valid Handover (Ca gối đầu hợp lệ):
                // 1. Same branch (if branch information is known)
                Long candBranchId = context.getTargetBranchId();
                Long existBranchId = context.getScheduleBranchIdMap() != null && existing.getScheduleId() != null
                        ? context.getScheduleBranchIdMap().get(existing.getScheduleId())
                        : null;
                boolean sameBranch = (candBranchId == null || existBranchId == null || candBranchId.equals(existBranchId));

                // 2. Sequential order: Start1 < Start2 < End1 < End2 and overlap <= 60 minutes
                boolean isHandover = false;
                if (sameBranch) {
                    if (existing.getPlannedStartTime().isBefore(context.getPlannedStartTime()) &&
                            existing.getPlannedEndTime().isBefore(context.getPlannedEndTime())) {
                        // Existing is Shift 1, Candidate is Shift 2
                        long overlapMinutes = java.time.Duration.between(context.getPlannedStartTime(), existing.getPlannedEndTime()).toMinutes();
                        if (overlapMinutes > 0 && overlapMinutes <= 60) {
                            isHandover = true;
                        }
                    } else if (context.getPlannedStartTime().isBefore(existing.getPlannedStartTime()) &&
                            context.getPlannedEndTime().isBefore(existing.getPlannedEndTime())) {
                        // Candidate is Shift 1, Existing is Shift 2
                        long overlapMinutes = java.time.Duration.between(existing.getPlannedStartTime(), context.getPlannedEndTime()).toMinutes();
                        if (overlapMinutes > 0 && overlapMinutes <= 60) {
                            isHandover = true;
                        }
                    }
                }

                if (isHandover) {
                    // Valid handover overlap (gối đầu bàn giao ca <= 60 phút) -> Cho phép mà không chặn lỗi
                    continue;
                }

                String empName = context.getEmployee() != null ? context.getEmployee().getFullName() : "Nhân viên #" + context.getEmployeeId();
                String branchSuffix = "";
                if (context.getScheduleBranchNameMap() != null && existing.getScheduleId() != null) {
                    String existingBranchName = context.getScheduleBranchNameMap().get(existing.getScheduleId());
                    if (existingBranchName != null) {
                        branchSuffix = " tại " + existingBranchName;
                    }
                }
                String msg = String.format("Không thể xếp ca: Nhân viên %s đã có ca %s (%s - %s)%s trùng khung giờ với ca này.",
                        empName,
                        existing.getSnapshotShiftName(),
                        existing.getSnapshotStartTime().format(TIME_FMT),
                        existing.getSnapshotEndTime().format(TIME_FMT),
                        branchSuffix);

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
