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
import com.company.hrms.modules.branch.domain.Branch;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.schedule.domain.Schedule;
import com.company.hrms.modules.schedule.repository.ScheduleRepository;
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
    private final ScheduleRepository scheduleRepository;
    private final BranchRepository branchRepository;

    public ConflictDetectionEngine(
            List<ConflictRule> rules,
            EmployeeRepository employeeRepository,
            ShiftAssignmentRepository assignmentRepository,
            LeaveRequestRepository leaveRequestRepository,
            CompanyHolidayRepository holidayRepository,
            WorkShiftRepository workShiftRepository,
            SystemSettingRepository systemSettingRepository,
            ScheduleRepository scheduleRepository,
            BranchRepository branchRepository) {
        this.rules = rules;
        this.employeeRepository = employeeRepository;
        this.assignmentRepository = assignmentRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.holidayRepository = holidayRepository;
        this.workShiftRepository = workShiftRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.scheduleRepository = scheduleRepository;
        this.branchRepository = branchRepository;
    }

    public ConflictValidationResult validateAssignment(
            Long employeeId,
            Long workShiftId,
            LocalDate workDate,
            Long excludeAssignmentId) {
        return validateAssignment(employeeId, workShiftId, workDate, excludeAssignmentId, null, null);
    }

    public ConflictValidationResult validateAssignment(
            Long employeeId,
            Long workShiftId,
            LocalDate workDate,
            Long excludeAssignmentId,
            Long targetScheduleId,
            Long targetBranchId) {

        Employee employee = employeeRepository.findByIdAndDeletedAtIsNull(employeeId).orElse(null);
        WorkShift workShift = workShiftRepository.findByIdAndDeletedAtIsNull(workShiftId).orElse(null);

        LocalDateTime[] times = calculatePlannedTimes(
                workDate,
                workShift != null ? workShift.getStartTime() : LocalTime.of(8, 0),
                workShift != null ? workShift.getEndTime() : LocalTime.of(17, 0),
                workShift != null && Boolean.TRUE.equals(workShift.getIsCrossMidnight())
        );

        // Fetch existing assignments around this date for the employee (to detect overnight/rest/overlap issues)
        List<ShiftAssignment> existingAssignments = new ArrayList<>(assignmentRepository.findAllByEmployeeIdAndWorkDateBetween(
                employeeId,
                workDate.minusDays(2),
                workDate.plusDays(2)
        ));

        // Also fetch all existing assignments for this workShift on this workDate to evaluate staffing capacity
        Long effectiveBranchId = targetBranchId;
        if (effectiveBranchId == null && targetScheduleId != null) {
            effectiveBranchId = scheduleRepository.findById(targetScheduleId).map(Schedule::getBranchId).orElse(null);
        }
        if (effectiveBranchId == null && employee != null) {
            effectiveBranchId = employee.getBranchId();
        }

        if (effectiveBranchId != null) {
            List<ShiftAssignment> shiftSlotAssignments = assignmentRepository.findAssignmentsByBranchShiftAndDate(
                    effectiveBranchId, workShiftId, workDate);
            for (ShiftAssignment ssa : shiftSlotAssignments) {
                if (!existingAssignments.contains(ssa)) {
                    existingAssignments.add(ssa);
                }
            }
        } else if (targetScheduleId != null) {
            List<ShiftAssignment> shiftSlotAssignments = assignmentRepository.findAssignmentsByShiftAndDate(
                    targetScheduleId, workShiftId, workDate);
            for (ShiftAssignment ssa : shiftSlotAssignments) {
                if (!existingAssignments.contains(ssa)) {
                    existingAssignments.add(ssa);
                }
            }
        }

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
        populateBranchContext(context, targetScheduleId, targetBranchId);

        ConflictValidationResult result = new ConflictValidationResult();
        for (ConflictRule rule : rules) {
            rule.evaluate(context, result);
        }

        return result;
    }

    private void populateBranchContext(ConflictDetectionContext context, Long targetScheduleId, Long explicitBranchId) {
        Long targetBranchId = explicitBranchId;
        if (targetBranchId == null && targetScheduleId != null) {
            targetBranchId = scheduleRepository.findById(targetScheduleId)
                    .map(Schedule::getBranchId)
                    .orElse(null);
        }
        if (targetBranchId == null && context.getEmployee() != null) {
            targetBranchId = context.getEmployee().getBranchId();
        }
        context.setTargetBranchId(targetBranchId);
        if (targetBranchId != null) {
            context.setTargetBranchName(branchRepository.findByIdAndDeletedAtIsNull(targetBranchId)
                    .map(Branch::getBranchName)
                    .orElse("Chi nhánh #" + targetBranchId));
        }

        List<ShiftAssignment> existing = context.getExistingAssignments();
        if (existing != null && !existing.isEmpty()) {
            List<Long> schedIds = existing.stream()
                    .map(ShiftAssignment::getScheduleId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            if (!schedIds.isEmpty()) {
                List<Schedule> scheds = scheduleRepository.findAllById(schedIds);
                Map<Long, Long> schedBranchMap = new HashMap<>();
                List<Long> bIds = new ArrayList<>();
                for (Schedule s : scheds) {
                    schedBranchMap.put(s.getId(), s.getBranchId());
                    if (s.getBranchId() != null) {
                        bIds.add(s.getBranchId());
                    }
                }
                Map<Long, String> bNameMap = branchRepository.findAllById(bIds).stream()
                        .collect(Collectors.toMap(Branch::getId, Branch::getBranchName, (k1, k2) -> k1));
                Map<Long, String> schedBranchNameMap = new HashMap<>();
                for (Map.Entry<Long, Long> entry : schedBranchMap.entrySet()) {
                    schedBranchNameMap.put(entry.getKey(), bNameMap.getOrDefault(entry.getValue(), "Chi nhánh #" + entry.getValue()));
                }
                context.setScheduleBranchIdMap(schedBranchMap);
                context.setScheduleBranchNameMap(schedBranchNameMap);
            }
        }
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
                populateBranchContext(context, null, null);

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
