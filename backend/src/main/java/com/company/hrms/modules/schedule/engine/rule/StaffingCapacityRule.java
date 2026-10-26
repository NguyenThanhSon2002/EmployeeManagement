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
            String msg = String.format("Ca %s ngày %s đã đạt định biên tối đa %d NV. Không thể phân công thêm nhân sự.",
                    shift.getShiftName(), context.getWorkDate(), shift.getMaxStaffing());

            result.addMandatoryError(new ScheduleConflictDto(
                    "ERR_STAFFING_CAPACITY",
                    "MANDATORY",
                    context.getEmployeeId(),
                    empName,
                    context.getWorkDate(),
                    context.getWorkShiftId(),
                    msg
            ));
        }
    }
}
