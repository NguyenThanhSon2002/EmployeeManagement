package com.company.hrms.modules.schedule.engine.rule;

import com.company.hrms.modules.schedule.domain.CompanyHoliday;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;
import com.company.hrms.modules.schedule.engine.ConflictDetectionContext;
import org.springframework.stereotype.Component;

@Component
public class HolidayAssignmentRule implements ConflictRule {

    @Override
    public void evaluate(ConflictDetectionContext context, ConflictValidationResult result) {
        if (context.getHolidays() == null || context.getHolidays().isEmpty()) {
            return;
        }

        for (CompanyHoliday holiday : context.getHolidays()) {
            if (context.getWorkDate().equals(holiday.getHolidayDate())) {
                String empName = context.getEmployee() != null ? context.getEmployee().getFullName() : "Nhân viên #" + context.getEmployeeId();
                String msg = String.format("Ngày %s là ngày nghỉ lễ (%s). Ca làm việc này sẽ áp dụng chính sách làm thêm ngày lễ theo quy định.",
                        context.getWorkDate(), holiday.getHolidayName());

                result.addWarning(new ScheduleConflictDto(
                        "WARN_HOLIDAY_ASSIGNMENT",
                        "WARNING",
                        context.getEmployeeId(),
                        empName,
                        context.getWorkDate(),
                        context.getWorkShiftId(),
                        msg
                ));
                break;
            }
        }
    }
}
