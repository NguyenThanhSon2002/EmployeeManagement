package com.company.hrms.modules.schedule.engine.rule;

import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;
import com.company.hrms.modules.schedule.engine.ConflictDetectionContext;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class TravelBufferRule implements ConflictRule {

    @Override
    public void evaluate(ConflictDetectionContext context, ConflictValidationResult result) {
        if (context.getPlannedStartTime() == null || context.getPlannedEndTime() == null) {
            return;
        }

        Long targetBranchId = context.getTargetBranchId();
        String targetBranchName = context.getTargetBranchName();

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

            Long existingBranchId = context.getScheduleBranchIdMap().get(existing.getScheduleId());
            // Chỉ áp dụng cảnh báo thời gian di chuyển giữa 2 CƠ SỞ KHÁC NHAU
            if (targetBranchId != null && existingBranchId != null && targetBranchId.equals(existingBranchId)) {
                continue;
            }

            // Existing kết thúc trước khi ca mới bắt đầu
            if (!existing.getPlannedEndTime().isAfter(context.getPlannedStartTime())) {
                if (latestBefore == null || existing.getPlannedEndTime().isAfter(latestBefore.getPlannedEndTime())) {
                    latestBefore = existing;
                }
            }

            // Existing bắt đầu sau khi ca mới kết thúc
            if (!existing.getPlannedStartTime().isBefore(context.getPlannedEndTime())) {
                if (earliestAfter == null || existing.getPlannedStartTime().isBefore(earliestAfter.getPlannedStartTime())) {
                    earliestAfter = existing;
                }
            }
        }

        String empName = context.getEmployee() != null ? context.getEmployee().getFullName() : "Nhân viên #" + context.getEmployeeId();
        double bufferMinutes = context.getTravelBufferMinutes();

        // 1. Kiểm tra với ca liền trước
        if (latestBefore != null) {
            long gapMinutes = Duration.between(latestBefore.getPlannedEndTime(), context.getPlannedStartTime()).toMinutes();
            if (gapMinutes >= 0 && gapMinutes < bufferMinutes) {
                String beforeBranch = context.getScheduleBranchNameMap().getOrDefault(latestBefore.getScheduleId(), "cơ sở trước");
                String currentBranch = targetBranchName != null ? targetBranchName : "cơ sở này";
                String msg = String.format("Khoảng cách giữa ca tại %s và ca tại %s chỉ có %d phút, không đủ thời gian di chuyển an toàn giữa 2 cơ sở (khuyến nghị tối thiểu %.0f phút).",
                        beforeBranch, currentBranch, gapMinutes, bufferMinutes);

                result.addWarning(new ScheduleConflictDto(
                        "WARN_TRAVEL_BUFFER",
                        "WARNING",
                        context.getEmployeeId(),
                        empName,
                        context.getWorkDate(),
                        context.getWorkShiftId(),
                        msg
                ));
                return;
            }
        }

        // 2. Kiểm tra với ca liền sau
        if (earliestAfter != null) {
            long gapMinutes = Duration.between(context.getPlannedEndTime(), earliestAfter.getPlannedStartTime()).toMinutes();
            if (gapMinutes >= 0 && gapMinutes < bufferMinutes) {
                String afterBranch = context.getScheduleBranchNameMap().getOrDefault(earliestAfter.getScheduleId(), "cơ sở tiếp theo");
                String currentBranch = targetBranchName != null ? targetBranchName : "cơ sở này";
                String msg = String.format("Khoảng cách giữa ca tại %s và ca tại %s chỉ có %d phút, không đủ thời gian di chuyển an toàn giữa 2 cơ sở (khuyến nghị tối thiểu %.0f phút).",
                        currentBranch, afterBranch, gapMinutes, bufferMinutes);

                result.addWarning(new ScheduleConflictDto(
                        "WARN_TRAVEL_BUFFER",
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
