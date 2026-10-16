package com.company.hrms.modules.schedule.engine;

import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.leave.domain.LeaveRequest;
import com.company.hrms.modules.leave.repository.LeaveRequestRepository;
import com.company.hrms.modules.schedule.domain.CompanyHoliday;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.engine.rule.ConflictRule;
import com.company.hrms.modules.schedule.repository.CompanyHolidayRepository;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import com.company.hrms.modules.setting.domain.SystemSetting;
import com.company.hrms.modules.setting.repository.SystemSettingRepository;
import com.company.hrms.modules.shift.domain.WorkShift;
import com.company.hrms.modules.shift.repository.WorkShiftRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ConflictDetectionEngine {

    private final List<ConflictRule> rules;
    private final EmployeeRepository employeeRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final CompanyHolidayRepository holidayRepository;
    private final WorkShiftRepository workShiftRepository;
    private final SystemSettingRepository systemSettingRepository;

    public ConflictDetectionEngine(
            List<ConflictRule> rules,
            EmployeeRepository employeeRepository,
            ShiftAssignmentRepository assignmentRepository,
            LeaveRequestRepository leaveRequestRepository,
            CompanyHolidayRepository holidayRepository,
            WorkShiftRepository workShiftRepository,
            SystemSettingRepository systemSettingRepository) {
        this.rules = rules;
        this.employeeRepository = employeeRepository;
        this.assignmentRepository = assignmentRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.holidayRepository = holidayRepository;
        this.workShiftRepository = workShiftRepository;
        this.systemSettingRepository = systemSettingRepository;
    }

    public ConflictValidationResult validateAssignment(
            Long employeeId,
            Long workShiftId,
            LocalDate workDate,
            Long excludeAssignmentId) {

        Employee employee = employeeRepository.findByIdAndDeletedAtIsNull(employeeId).orElse(null);
        WorkShift workShift = workShiftRepository.findByIdAndDeletedAtIsNull(workShiftId).orElse(null);

        LocalDateTime[] times = calculatePlannedTimes(
                workDate,
                workShift != null ? workShift.getStartTime() : LocalTime.of(8, 0),
                workShift != null ? workShift.getEndTime() : LocalTime.of(17, 0),
                workShift != null && Boolean.TRUE.equals(workShift.getIsCrossMidnight())
        );

        // Fetch existing assignments around this date (from 1 day before to 1 day after to detect overnight/rest issues)
        List<ShiftAssignment> existingAssignments = assignmentRepository.findAllByEmployeeIdAndWorkDateBetween(
                employeeId,
                workDate.minusDays(2),
                workDate.plusDays(2)
        );

        List<LeaveRequest> approvedLeaves = leaveRequestRepository.findApprovedLeavesByEmployeeAndDate(employeeId, workDate);
        List<CompanyHoliday> holidays = holidayRepository.findAllByHolidayDateBetween(workDate.minusDays(1), workDate.plusDays(1));

        Map<Long, WorkShift> shiftMap = workShift != null
                ? Map.of(workShift.getId(), workShift)
                : Collections.emptyMap();

        ConflictDetectionContext context = new ConflictDetectionContext(
                employeeId,
                workDate,
                workShiftId,
                workShift,
                times[0],
                times[1],
                excludeAssignmentId,
                employee,
                existingAssignments,
                approvedLeaves,
                holidays,
                shiftMap
        );

        applySystemSettings(context);

        ConflictValidationResult result = new ConflictValidationResult();
        for (ConflictRule rule : rules) {
            rule.evaluate(context, result);
        }

        return result;
    }

    public ConflictValidationResult validateBulk(
            List<Long> employeeIds,
            Long workShiftId,
            LocalDate fromDate,
            LocalDate toDate) {

        ConflictValidationResult overallResult = new ConflictValidationResult();
        if (employeeIds == null || employeeIds.isEmpty() || fromDate == null || toDate == null) {
            return overallResult;
        }

        WorkShift workShift = workShiftRepository.findByIdAndDeletedAtIsNull(workShiftId).orElse(null);
        Map<Long, Employee> employeeMap = employeeRepository.findAllById(employeeIds).stream()
                .collect(Collectors.toMap(Employee::getId, Function.identity()));

        List<ShiftAssignment> existingAssignments = assignmentRepository.findAllByEmployeeIdInAndWorkDateBetween(
                employeeIds,
                fromDate.minusDays(2),
                toDate.plusDays(2)
        );

        List<LeaveRequest> approvedLeaves = leaveRequestRepository.findApprovedLeavesForEmployeesInDateRange(
                employeeIds,
                fromDate,
                toDate
        );

        List<CompanyHoliday> holidays = holidayRepository.findAllByHolidayDateBetween(
                fromDate.minusDays(1),
                toDate.plusDays(1)
        );

        Map<Long, WorkShift> shiftMap = workShift != null ? Map.of(workShift.getId(), workShift) : Collections.emptyMap();

        for (Long empId : employeeIds) {
            Employee employee = employeeMap.get(empId);
            LocalDate curr = fromDate;
            while (!curr.isAfter(toDate)) {
                LocalDateTime[] times = calculatePlannedTimes(
                        curr,
                        workShift != null ? workShift.getStartTime() : LocalTime.of(8, 0),
                        workShift != null ? workShift.getEndTime() : LocalTime.of(17, 0),
                        workShift != null && Boolean.TRUE.equals(workShift.getIsCrossMidnight())
                );

                ConflictDetectionContext context = new ConflictDetectionContext(
                        empId,
                        curr,
                        workShiftId,
                        workShift,
                        times[0],
                        times[1],
                        null,
                        employee,
                        existingAssignments,
                        approvedLeaves,
                        holidays,
                        shiftMap
                );

                applySystemSettings(context);

                for (ConflictRule rule : rules) {
                    rule.evaluate(context, overallResult);
                }

                curr = curr.plusDays(1);
            }
        }

        return overallResult;
    }

    public static LocalDateTime[] calculatePlannedTimes(
            LocalDate workDate,
            LocalTime startTime,
            LocalTime endTime,
            boolean isCrossMidnight) {

        LocalDateTime start = LocalDateTime.of(workDate, startTime);
        LocalDateTime end;
        if (isCrossMidnight || endTime.isBefore(startTime) || endTime.equals(startTime)) {
            end = LocalDateTime.of(workDate.plusDays(1), endTime);
        } else {
            end = LocalDateTime.of(workDate, endTime);
        }
        return new LocalDateTime[]{start, end};
    }

    private void applySystemSettings(ConflictDetectionContext context) {
        systemSettingRepository.findBySettingKey("MIN_REST_BETWEEN_SHIFTS_HOURS")
                .map(SystemSetting::getSettingValue)
                .ifPresent(v -> {
                    try { context.setMinRestHours(Double.parseDouble(v)); } catch (Exception ignored) {}
                });

        systemSettingRepository.findBySettingKey("MAX_WEEKLY_HOURS")
                .map(SystemSetting::getSettingValue)
                .ifPresent(v -> {
                    try { context.setMaxWeeklyHours(Double.parseDouble(v)); } catch (Exception ignored) {}
                });

        systemSettingRepository.findBySettingKey("MAX_DAILY_HOURS")
                .map(SystemSetting::getSettingValue)
                .ifPresent(v -> {
                    try { context.setMaxDailyHours(Double.parseDouble(v)); } catch (Exception ignored) {}
                });

        systemSettingRepository.findBySettingKey("LEAVE_CONFLICT_SEVERITY")
                .map(SystemSetting::getSettingValue)
                .ifPresent(context::setLeaveSeverity);
    }
}
