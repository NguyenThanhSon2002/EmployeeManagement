package com.company.hrms.modules.schedule.engine.rule;

import com.company.hrms.modules.leave.domain.LeaveRequest;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;
import com.company.hrms.modules.schedule.engine.ConflictDetectionContext;
import org.springframework.stereotype.Component;

@Component
public class ApprovedLeaveOverlapRule implements ConflictRule {

    @Override
    public void evaluate(ConflictDetectionContext context, ConflictValidationResult result) {
        if (context.getApprovedLeaves() == null || context.getApprovedLeaves().isEmpty()) {
            return;
        }

        for (LeaveRequest leave : context.getApprovedLeaves()) {
            if (!context.getEmployeeId().equals(leave.getEmployeeId())) {
                continue;
            }
            if (!"APPROVED".equalsIgnoreCase(leave.getStatus())) {
                continue;
            }

            // Check if context.getWorkDate() is between leave.startDate and leave.endDate
            boolean overlaps = !context.getWorkDate().isBefore(leave.getStartDate()) &&
                    !context.getWorkDate().isAfter(leave.getEndDate());

            if (overlaps) {
                String empName = context.getEmployee() != null ? context.getEmployee().getFullName() : "Nhân viên #" + context.getEmployeeId();
                String severity = "MANDATORY".equalsIgnoreCase(context.getLeaveSeverity()) ? "MANDATORY" : "WARNING";
                String msg = String.format("Nhân viên %s đã được phê duyệt đơn nghỉ phép vào ngày %s (từ %s đến %s).",
                        empName, context.getWorkDate(), leave.getStartDate(), leave.getEndDate());

                ScheduleConflictDto conflict = new ScheduleConflictDto(
                        "WARN_LEAVE_CONFLICT",
                        severity,
                        context.getEmployeeId(),
                        empName,
                        context.getWorkDate(),
                        context.getWorkShiftId(),
                        msg
                );

                if ("MANDATORY".equalsIgnoreCase(severity)) {
                    result.addMandatoryError(conflict);
                } else {
                    result.addWarning(conflict);
                }
                break;
            }
        }
    }
}
