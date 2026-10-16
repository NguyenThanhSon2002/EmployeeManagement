package com.company.hrms.modules.schedule.service;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.department.domain.Department;
import com.company.hrms.modules.department.repository.DepartmentRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.schedule.domain.CompanyHoliday;
import com.company.hrms.modules.schedule.domain.Schedule;
import com.company.hrms.modules.schedule.domain.ScheduleChangeHistory;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.*;
import com.company.hrms.modules.schedule.engine.ConflictDetectionEngine;
import com.company.hrms.modules.schedule.repository.CompanyHolidayRepository;
import com.company.hrms.modules.schedule.repository.ScheduleChangeHistoryRepository;
import com.company.hrms.modules.schedule.repository.ScheduleRepository;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import com.company.hrms.modules.shift.domain.WorkShift;
import com.company.hrms.modules.shift.dto.WorkShiftDto;
import com.company.hrms.modules.shift.repository.WorkShiftRepository;
import com.company.hrms.modules.shift.service.WorkShiftService;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final ScheduleChangeHistoryRepository historyRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkShiftRepository workShiftRepository;
    private final WorkShiftService workShiftService;
    private final CompanyHolidayRepository holidayRepository;
    private final ConflictDetectionEngine conflictEngine;

    public ScheduleService(
            ScheduleRepository scheduleRepository,
            ShiftAssignmentRepository assignmentRepository,
            ScheduleChangeHistoryRepository historyRepository,
            DepartmentRepository departmentRepository,
            EmployeeRepository employeeRepository,
            WorkShiftRepository workShiftRepository,
            WorkShiftService workShiftService,
            CompanyHolidayRepository holidayRepository,
            ConflictDetectionEngine conflictEngine) {
        this.scheduleRepository = scheduleRepository;
        this.assignmentRepository = assignmentRepository;
        this.historyRepository = historyRepository;
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.workShiftRepository = workShiftRepository;
        this.workShiftService = workShiftService;
        this.holidayRepository = holidayRepository;
        this.conflictEngine = conflictEngine;
    }

    @Transactional
    public WeeklyScheduleResponse getWeeklySchedule(Long departmentId, LocalDate date) {
        Department dept = departmentRepository.findByIdAndDeletedAtIsNull(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Phòng ban", departmentId));

        LocalDate monday = date.with(DayOfWeek.MONDAY);
        LocalDate sunday = monday.plusDays(6);

        Schedule schedule = scheduleRepository.findByDepartmentIdAndStartDate(departmentId, monday)
                .orElseGet(() -> {
                    Schedule newSched = new Schedule(departmentId, monday, sunday);
                    return scheduleRepository.save(newSched);
                });

        List<Employee> employees = employeeRepository.findAllByDepartmentIdAndDeletedAtIsNull(departmentId);
        List<ShiftAssignment> assignments = assignmentRepository.findAllByScheduleId(schedule.getId());

        Map<Long, List<ShiftAssignment>> assignmentMap = assignments.stream()
                .collect(Collectors.groupingBy(ShiftAssignment::getEmployeeId));

        WeeklyScheduleResponse response = new WeeklyScheduleResponse();
        response.setScheduleId(schedule.getId());
        response.setDepartmentId(dept.getId());
        response.setDepartmentName(dept.getDepartmentName());
        response.setStartDate(monday);
        response.setEndDate(sunday);
        response.setStatus(schedule.getStatus());
        response.setVersion(schedule.getVersion());

        List<WeeklyScheduleResponse.EmployeeScheduleDto> employeeDtos = new ArrayList<>();
        for (Employee emp : employees) {
            WeeklyScheduleResponse.EmployeeScheduleDto empDto = new WeeklyScheduleResponse.EmployeeScheduleDto(
                    emp.getId(),
                    emp.getEmployeeCode(),
                    emp.getFullName()
            );

            List<ShiftAssignment> empAssigns = assignmentMap.getOrDefault(emp.getId(), Collections.emptyList());
            double totalHours = 0.0;
            List<ShiftAssignmentDto> dtoList = new ArrayList<>();

            for (ShiftAssignment a : empAssigns) {
                if (!"CANCELLED".equalsIgnoreCase(a.getStatus())) {
                    int breakMin = a.getSnapshotBreakMinutes() != null ? a.getSnapshotBreakMinutes() : 0;
                    long mins = Math.max(0, Duration.between(a.getPlannedStartTime(), a.getPlannedEndTime()).toMinutes() - breakMin);
                    totalHours += mins / 60.0;
                }
                dtoList.add(toDto(a));
            }

            empDto.setWeeklyScheduledHours(Math.round(totalHours * 10.0) / 10.0);
            empDto.setAssignments(dtoList);
            employeeDtos.add(empDto);
        }
        response.setEmployees(employeeDtos);

        // Holidays
        List<CompanyHoliday> holidays = holidayRepository.findAllByHolidayDateBetween(monday, sunday);
        response.setHolidays(holidays.stream()
                .map(h -> new WeeklyScheduleResponse.HolidayDto(h.getHolidayDate(), h.getHolidayName()))
                .collect(Collectors.toList()));

        // Templates
        response.setShiftTemplates(workShiftService.getAllWorkShifts());

        return response;
    }

    @Transactional(readOnly = true)
    public ConflictValidationResult validateConflicts(ValidateConflictsRequest request) {
        ConflictValidationResult overall = new ConflictValidationResult();
        for (ValidateConflictsRequest.CandidateAssignmentItem item : request.getAssignments()) {
            ConflictValidationResult res = conflictEngine.validateAssignment(
                    item.getEmployeeId(),
                    item.getWorkShiftId(),
                    item.getWorkDate(),
                    item.getExcludeAssignmentId()
            );

            if (res.getHasMandatoryErrors()) {
                res.getMandatoryErrors().forEach(overall::addMandatoryError);
            }
            if (res.getHasWarnings()) {
                res.getWarnings().forEach(overall::addWarning);
            }
        }
        return overall;
    }

    @Transactional
    public ShiftAssignmentDto assignSingleShift(AssignSingleShiftRequest request, Long currentUserId) {
        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", request.getScheduleId()));

        if (request.getScheduleVersion() != null && !schedule.getVersion().equals(request.getScheduleVersion())) {
            throw new ObjectOptimisticLockingFailureException(Schedule.class, schedule.getId());
        }

        WorkShift shift = workShiftRepository.findByIdAndDeletedAtIsNull(request.getWorkShiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Mẫu ca làm việc", request.getWorkShiftId()));

        ConflictValidationResult validation = conflictEngine.validateAssignment(
                request.getEmployeeId(),
                request.getWorkShiftId(),
                request.getWorkDate(),
                null
        );

        if (validation.getHasMandatoryErrors()) {
            ScheduleConflictDto err = validation.getMandatoryErrors().get(0);
            throw new BusinessException(err.getRuleCode(), err.getMessage(), HttpStatus.UNPROCESSABLE_ENTITY);
        }

        if (validation.getHasWarnings()) {
            if (request.getOverrideReason() == null || request.getOverrideReason().trim().length() < 5) {
                ScheduleConflictDto warn = validation.getWarnings().get(0);
                throw new BusinessException(warn.getRuleCode(),
                        warn.getMessage() + " Yêu cầu nhập lý do giải trình đặc cách.", HttpStatus.UNPROCESSABLE_ENTITY);
            }
        }

        LocalDateTime[] times = ConflictDetectionEngine.calculatePlannedTimes(
                request.getWorkDate(),
                shift.getStartTime(),
                shift.getEndTime(),
                Boolean.TRUE.equals(shift.getIsCrossMidnight())
        );

        ShiftAssignment assignment = new ShiftAssignment();
        assignment.setScheduleId(schedule.getId());
        assignment.setEmployeeId(request.getEmployeeId());
        assignment.setWorkShiftId(shift.getId());
        assignment.setWorkDate(request.getWorkDate());
        assignment.setSnapshotShiftName(shift.getShiftName());
        assignment.setSnapshotStartTime(shift.getStartTime());
        assignment.setSnapshotEndTime(shift.getEndTime());
        assignment.setSnapshotBreakMinutes(shift.getBreakMinutes());
        assignment.setSnapshotCrossMidnight(shift.getIsCrossMidnight());
        assignment.setSnapshotColorCode(shift.getColorCode());
        assignment.setPlannedStartTime(times[0]);
        assignment.setPlannedEndTime(times[1]);
        assignment.setStatus("ASSIGNED");
        assignment.setOverrideRule(request.getOverrideRule());
        assignment.setOverrideReason(request.getOverrideReason());

        ShiftAssignment saved = assignmentRepository.save(assignment);

        schedule.setVersion(schedule.getVersion() + 1);
        scheduleRepository.save(schedule);

        if ("PUBLISHED".equalsIgnoreCase(schedule.getStatus())) {
            historyRepository.save(new ScheduleChangeHistory(
                    schedule.getId(),
                    saved.getId(),
                    "CREATE",
                    null,
                    "Gán ca: " + shift.getShiftName(),
                    request.getOverrideReason() != null ? request.getOverrideReason() : "Thêm ca sau công bố",
                    currentUserId != null ? currentUserId : 1L
            ));
        }

        return toDto(saved);
    }

    @Transactional
    public List<ShiftAssignmentDto> bulkAssign(BulkAssignRequest request, Long currentUserId) {
        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", request.getScheduleId()));

        if (request.getScheduleVersion() != null && !schedule.getVersion().equals(request.getScheduleVersion())) {
            throw new ObjectOptimisticLockingFailureException(Schedule.class, schedule.getId());
        }

        WorkShift shift = workShiftRepository.findByIdAndDeletedAtIsNull(request.getWorkShiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Mẫu ca làm việc", request.getWorkShiftId()));

        ConflictValidationResult validation = conflictEngine.validateBulk(
                request.getEmployeeIds(),
                request.getWorkShiftId(),
                request.getFromDate(),
                request.getToDate()
        );

        if (validation.getHasMandatoryErrors()) {
            ScheduleConflictDto err = validation.getMandatoryErrors().get(0);
            throw new BusinessException(err.getRuleCode(), err.getMessage(), HttpStatus.UNPROCESSABLE_ENTITY);
        }

        List<ShiftAssignment> savedList = new ArrayList<>();
        for (Long empId : request.getEmployeeIds()) {
            LocalDate curr = request.getFromDate();
            while (!curr.isAfter(request.getToDate())) {
                LocalDateTime[] times = ConflictDetectionEngine.calculatePlannedTimes(
                        curr,
                        shift.getStartTime(),
                        shift.getEndTime(),
                        Boolean.TRUE.equals(shift.getIsCrossMidnight())
                );

                ShiftAssignment assignment = new ShiftAssignment();
                assignment.setScheduleId(schedule.getId());
                assignment.setEmployeeId(empId);
                assignment.setWorkShiftId(shift.getId());
                assignment.setWorkDate(curr);
                assignment.setSnapshotShiftName(shift.getShiftName());
                assignment.setSnapshotStartTime(shift.getStartTime());
                assignment.setSnapshotEndTime(shift.getEndTime());
                assignment.setSnapshotBreakMinutes(shift.getBreakMinutes());
                assignment.setSnapshotCrossMidnight(shift.getIsCrossMidnight());
                assignment.setSnapshotColorCode(shift.getColorCode());
                assignment.setPlannedStartTime(times[0]);
                assignment.setPlannedEndTime(times[1]);
                assignment.setStatus("ASSIGNED");

                savedList.add(assignmentRepository.save(assignment));
                curr = curr.plusDays(1);
            }
        }

        schedule.setVersion(schedule.getVersion() + 1);
        scheduleRepository.save(schedule);

        if ("PUBLISHED".equalsIgnoreCase(schedule.getStatus())) {
            for (ShiftAssignment sa : savedList) {
                historyRepository.save(new ScheduleChangeHistory(
                        schedule.getId(),
                        sa.getId(),
                        "CREATE",
                        null,
                        "Gán ca hàng loạt: " + shift.getShiftName(),
                        "Gán ca hàng loạt sau công bố",
                        currentUserId != null ? currentUserId : 1L
                ));
            }
        }

        return savedList.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public void deleteAssignment(Long id, Integer scheduleVersion, Long currentUserId) {
        ShiftAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Phân ca", id));

        Schedule schedule = scheduleRepository.findById(assignment.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", assignment.getScheduleId()));

        if (scheduleVersion != null && !schedule.getVersion().equals(scheduleVersion)) {
            throw new ObjectOptimisticLockingFailureException(Schedule.class, schedule.getId());
        }

        if ("PUBLISHED".equalsIgnoreCase(schedule.getStatus())) {
            historyRepository.save(new ScheduleChangeHistory(
                    schedule.getId(),
                    assignment.getId(),
                    "DELETE",
                    "Xóa ca: " + assignment.getSnapshotShiftName(),
                    null,
                    "Xóa ca sau công bố",
                    currentUserId != null ? currentUserId : 1L
            ));
        }

        assignmentRepository.delete(assignment);
        schedule.setVersion(schedule.getVersion() + 1);
        scheduleRepository.save(schedule);
    }

    @Transactional
    public WeeklyScheduleResponse publishSchedule(Long scheduleId, Integer version, Long currentUserId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", scheduleId));

        if (version != null && !schedule.getVersion().equals(version)) {
            throw new ObjectOptimisticLockingFailureException(Schedule.class, scheduleId);
        }

        schedule.setStatus("PUBLISHED");
        schedule.setPublishedAt(LocalDateTime.now());
        schedule.setPublishedBy(currentUserId != null ? currentUserId : 1L);
        schedule.setVersion(schedule.getVersion() + 1);
        Schedule saved = scheduleRepository.save(schedule);

        return getWeeklySchedule(saved.getDepartmentId(), saved.getStartDate());
    }

    @Transactional
    public WeeklyScheduleResponse unpublishSchedule(Long scheduleId, Long currentUserId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", scheduleId));

        schedule.setStatus("DRAFT");
        schedule.setPublishedAt(null);
        schedule.setPublishedBy(null);
        schedule.setVersion(schedule.getVersion() + 1);
        Schedule saved = scheduleRepository.save(schedule);

        return getWeeklySchedule(saved.getDepartmentId(), saved.getStartDate());
    }

    public ShiftAssignmentDto toDto(ShiftAssignment a) {
        ShiftAssignmentDto dto = new ShiftAssignmentDto();
        dto.setId(a.getId());
        dto.setScheduleId(a.getScheduleId());
        dto.setEmployeeId(a.getEmployeeId());
        dto.setWorkShiftId(a.getWorkShiftId());
        dto.setWorkDate(a.getWorkDate());
        dto.setShiftName(a.getSnapshotShiftName());
        dto.setStartTime(a.getSnapshotStartTime());
        dto.setEndTime(a.getSnapshotEndTime());
        dto.setBreakMinutes(a.getSnapshotBreakMinutes());
        dto.setIsCrossMidnight(a.getSnapshotCrossMidnight());
        dto.setColorCode(a.getSnapshotColorCode());
        dto.setStatus(a.getStatus());
        dto.setOverrideRule(a.getOverrideRule());
        dto.setOverrideReason(a.getOverrideReason());
        dto.setVersion(a.getVersion());
        return dto;
    }
}
