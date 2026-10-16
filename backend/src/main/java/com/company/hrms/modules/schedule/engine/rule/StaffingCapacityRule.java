package com.company.hrms.modules.schedule.engine.rule;

import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;
import com.company.hrms.modules.schedule.engine.ConflictDetectionContext;
import com.company.hrms.modules.shift.domain.WorkShift;
import org.springframework.stereotype.Component;

@Component
public class StaffingCapacityRule implements ConflictRule {

    @Override
    public void evaluate(ConflictDetectionContext context, ConflictValidationResult result) {
        WorkShift shift = context.getWorkShift();
        if (shift == null || shift.getMinStaffing() == null || shift.getMaxStaffing() == null) {
            return;
        }

        // Count assignments on the same workDate for this shift
        int count = 1; // including the candidate
        for (ShiftAssignment existing : context.getExistingAssignments()) {
            if ("CANCELLED".equalsIgnoreCase(existing.getStatus())) {
                continue;
            }
            if (context.getExcludeAssignmentId() != null && context.getExcludeAssignmentId().equals(existing.getId())) {
                continue;
            }
            if (context.getWorkDate().equals(existing.getWorkDate()) &&
                    context.getWorkShiftId().equals(existing.getWorkShiftId()) &&
                    !context.getEmployeeId().equals(existing.getEmployeeId())) {
                count++;
            }
        }

        String empName = context.getEmployee() != null ? context.getEmployee().getFullName() : "Nhân viên #" + context.getEmployeeId();

        if (count > shift.getMaxStaffing()) {
            String msg = String.format("Ca %s ngày %s hiện có %d/%d nhân sự (vượt quá định biên tối đa cho phép).",
                    shift.getShiftName(), context.getWorkDate(), count, shift.getMaxStaffing());

            result.addWarning(new ScheduleConflictDto(
                    "WARN_STAFFING_CAPACITY",
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
