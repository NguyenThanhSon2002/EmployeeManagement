package com.company.hrms.modules.schedule.engine.rule;

import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;
import com.company.hrms.modules.schedule.engine.ConflictDetectionContext;
import org.springframework.stereotype.Component;

@Component
public class EmployeeStatusRule implements ConflictRule {

    @Override
    public void evaluate(ConflictDetectionContext context, ConflictValidationResult result) {
        Employee emp = context.getEmployee();
        if (emp == null) {
            result.addMandatoryError(new ScheduleConflictDto(
                    "ERR_INVALID_EMPLOYEE_STATUS",
                    "MANDATORY",
                    context.getEmployeeId(),
                    "Không rõ",
                    context.getWorkDate(),
                    context.getWorkShiftId(),
                    "Không tìm thấy hồ sơ nhân viên trong hệ thống."
            ));
            return;
        }

        boolean isInactive = Boolean.FALSE.equals(emp.getIsActive()) || emp.getDeletedAt() != null;
        boolean isResigned = "RESIGNED".equalsIgnoreCase(emp.getEmploymentStatus());
        boolean beforeHire = emp.getHireDate() != null && context.getWorkDate().isBefore(emp.getHireDate());

        if (isInactive || isResigned || beforeHire) {
            String reason = isResigned ? "đã thôi việc" : (isInactive ? "đã bị vô hiệu hóa" : "chưa đến ngày vào làm (" + emp.getHireDate() + ")");
            String msg = String.format("Không thể gán ca cho nhân viên %s vì hồ sơ ở trạng thái %s.",
                    emp.getFullName(), reason);

            result.addMandatoryError(new ScheduleConflictDto(
                    "ERR_INVALID_EMPLOYEE_STATUS",
                    "MANDATORY",
                    context.getEmployeeId(),
                    emp.getFullName(),
                    context.getWorkDate(),
                    context.getWorkShiftId(),
                    msg
            ));
        }
    }
}
