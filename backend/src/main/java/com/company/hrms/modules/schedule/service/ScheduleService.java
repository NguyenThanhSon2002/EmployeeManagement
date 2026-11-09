package com.company.hrms.modules.schedule.service;

import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.branch.domain.Branch;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.employee.repository.EmployeeSecondaryBranchRepository;
import com.company.hrms.modules.schedule.domain.CompanyHoliday;
import com.company.hrms.modules.schedule.domain.Schedule;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.*;
import com.company.hrms.modules.schedule.engine.ConflictDetectionEngine;
import com.company.hrms.modules.schedule.repository.CompanyHolidayRepository;
import com.company.hrms.modules.schedule.repository.ScheduleRepository;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import com.company.hrms.modules.shift.service.WorkShiftService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service chính (Orchestrator / Facade) cho phân hệ Quản lý Lịch làm việc (Schedule).
 * Điều phối dữ liệu lịch tuần/tháng, công bố lịch, và ủy quyền các thao tác chuyên biệt
 * cho ScheduleAssignmentService và ScheduleCopyWeekService.
 */
@Service
public class ScheduleService {

    private static final Logger log = LoggerFactory.getLogger(ScheduleService.class);

    private final ScheduleRepository scheduleRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeSecondaryBranchRepository secondaryBranchRepository;
    private final WorkShiftService workShiftService;
    private final CompanyHolidayRepository holidayRepository;
    private final ConflictDetectionEngine conflictEngine;
    private final ScheduleAssignmentService assignmentService;
    private final ScheduleCopyWeekService copyWeekService;

    public ScheduleService(
            ScheduleRepository scheduleRepository,
            ShiftAssignmentRepository assignmentRepository,
            BranchRepository branchRepository,
            EmployeeRepository employeeRepository,
            EmployeeSecondaryBranchRepository secondaryBranchRepository,
            WorkShiftService workShiftService,
            CompanyHolidayRepository holidayRepository,
            ConflictDetectionEngine conflictEngine,
            ScheduleAssignmentService assignmentService,
            ScheduleCopyWeekService copyWeekService) {
        this.scheduleRepository = scheduleRepository;
        this.assignmentRepository = assignmentRepository;
        this.branchRepository = branchRepository;
        this.employeeRepository = employeeRepository;
        this.secondaryBranchRepository = secondaryBranchRepository;
        this.workShiftService = workShiftService;
        this.holidayRepository = holidayRepository;
        this.conflictEngine = conflictEngine;
        this.assignmentService = assignmentService;
        this.copyWeekService = copyWeekService;
    }

    @Transactional
    public WeeklyScheduleResponse getWeeklySchedule(Long branchId, LocalDate date) {
        Branch branch = branchRepository.findByIdAndDeletedAtIsNull(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Chi nhánh", branchId));

        LocalDate monday = date.with(DayOfWeek.MONDAY);
        LocalDate sunday = monday.plusDays(6);

        Schedule schedule = scheduleRepository.findByBranchIdAndStartDate(branchId, monday)
                .orElseGet(() -> {
                    Schedule newSched = new Schedule(branchId, monday, sunday);
                    return scheduleRepository.save(newSched);
                });

        List<Employee> primaryEmployees = employeeRepository.findAllByBranchIdAndDeletedAtIsNull(branchId)
                .stream()
                .filter(e -> e.getPositionId() == null || e.getPositionId() != 1L)
                .toList();

        List<com.company.hrms.modules.employee.domain.EmployeeSecondaryBranch> secondaryLinks = secondaryBranchRepository.findAllByBranchId(branchId);
        List<Long> secondaryEmpIds = secondaryLinks.stream()
                .map(com.company.hrms.modules.employee.domain.EmployeeSecondaryBranch::getEmployeeId)
                .toList();
        List<Employee> secondaryEmployees = secondaryEmpIds.isEmpty() ? Collections.emptyList()
                : employeeRepository.findAllById(secondaryEmpIds).stream()
                .filter(e -> e.getPositionId() == null || e.getPositionId() != 1L)
                .toList();

        List<ShiftAssignment> thisScheduleAssignments = assignmentRepository.findAllByScheduleId(schedule.getId()).stream()
                .filter(sa -> sa.getWorkDate() != null && !sa.getWorkDate().isBefore(monday) && !sa.getWorkDate().isAfter(sunday))
                .toList();
        
        // Dọn dẹp ca cũ của Giám đốc (nếu có lỡ gán trước đây)
        List<ShiftAssignment> directorAssignments = new ArrayList<>();
        for (ShiftAssignment sa : thisScheduleAssignments) {
            Employee emp = employeeRepository.findById(sa.getEmployeeId()).orElse(null);
            if (emp != null && emp.getPositionId() != null && emp.getPositionId() == 1L) {
                directorAssignments.add(sa);
            }
        }
        if (!directorAssignments.isEmpty()) {
            assignmentRepository.deleteAll(directorAssignments);
            thisScheduleAssignments = new ArrayList<>(thisScheduleAssignments);
            thisScheduleAssignments.removeAll(directorAssignments);
        }

        List<Long> assignedEmpIds = thisScheduleAssignments.stream().map(ShiftAssignment::getEmployeeId).distinct().toList();
        List<Employee> assignedEmployees = assignedEmpIds.isEmpty() ? Collections.emptyList()
                : employeeRepository.findAllById(assignedEmpIds).stream()
                .filter(e -> e.getPositionId() == null || e.getPositionId() != 1L)
                .toList();

        Map<Long, Employee> employeeMap = new LinkedHashMap<>();
        for (Employee emp : primaryEmployees) {
            employeeMap.put(emp.getId(), emp);
        }
        for (Employee emp : secondaryEmployees) {
            employeeMap.putIfAbsent(emp.getId(), emp);
        }
        for (Employee emp : assignedEmployees) {
            employeeMap.putIfAbsent(emp.getId(), emp);
        }

        List<Long> activeEmpIds = employeeMap.values().stream()
                .filter(e -> e.getDeletedAt() == null)
                .filter(e -> !"RESIGNED".equalsIgnoreCase(e.getEmploymentStatus()) && !Boolean.FALSE.equals(e.getIsActive()))
                .filter(e -> e.getPositionId() == null || e.getPositionId() != 1L)
                .map(Employee::getId)
                .toList();

        // Nạp tất cả ca làm việc trong tuần của các nhân sự này trên TOÀN BỘ chuỗi chi nhánh
        List<ShiftAssignment> allWeeklyAssignments = activeEmpIds.isEmpty() ? Collections.emptyList()
                : assignmentRepository.findAllByEmployeeIdInAndWorkDateBetween(activeEmpIds, monday, sunday);

        // Ánh xạ scheduleId -> branchId -> branchName
        List<Long> allSchedIds = allWeeklyAssignments.stream().map(ShiftAssignment::getScheduleId).distinct().toList();
        Map<Long, Long> schedToBranchMap = new HashMap<>();
        List<Long> bIds = new ArrayList<>();
        bIds.add(branchId);
        if (!allSchedIds.isEmpty()) {
            for (Schedule s : scheduleRepository.findAllById(allSchedIds)) {
                schedToBranchMap.put(s.getId(), s.getBranchId());
                if (s.getBranchId() != null) {
                    bIds.add(s.getBranchId());
                }
            }
        }
        Map<Long, String> branchNameMap = branchRepository.findAllById(bIds).stream()
                .collect(Collectors.toMap(Branch::getId, Branch::getBranchName, (k1, k2) -> k1));

        Map<Long, List<ShiftAssignment>> assignmentMap = allWeeklyAssignments.stream()
                .collect(Collectors.groupingBy(ShiftAssignment::getEmployeeId));

        WeeklyScheduleResponse response = new WeeklyScheduleResponse();
        response.setScheduleId(schedule.getId());
        response.setBranchId(branch.getId());
        response.setBranchName(branch.getBranchName());
        response.setStartDate(monday);
        response.setEndDate(sunday);
        response.setStatus(schedule.getStatus());
        response.setVersion(schedule.getVersion());

        List<WeeklyScheduleResponse.EmployeeScheduleDto> employeeDtos = new ArrayList<>();
        for (Long empId : activeEmpIds) {
            Employee emp = employeeMap.get(empId);
            WeeklyScheduleResponse.EmployeeScheduleDto empDto = new WeeklyScheduleResponse.EmployeeScheduleDto(
                    emp.getId(),
                    emp.getEmployeeCode(),
                    emp.getFullName(),
                    emp.getEmploymentStatus(),
                    emp.getIsActive()
            );

            empDto.setHomeBranchId(emp.getBranchId());
            empDto.setHomeBranchName(branchNameMap.getOrDefault(emp.getBranchId(), "Chi nhánh #" + emp.getBranchId()));

            List<ShiftAssignment> empAssigns = assignmentMap.getOrDefault(emp.getId(), Collections.emptyList());
            double branchHours = 0.0;
            double totalChainHours = 0.0;
            boolean hasExternal = false;
            List<ShiftAssignmentDto> dtoList = new ArrayList<>();

            for (ShiftAssignment a : empAssigns) {
                Long aBranchId = schedToBranchMap.getOrDefault(a.getScheduleId(), branchId);
                String aBranchName = branchNameMap.getOrDefault(aBranchId, branch.getBranchName());
                boolean isExternal = !aBranchId.equals(branchId);
                if (isExternal) {
                    hasExternal = true;
                }

                if (!"CANCELLED".equalsIgnoreCase(a.getStatus())) {
                    int breakMin = a.getSnapshotBreakMinutes() != null ? a.getSnapshotBreakMinutes() : 0;
                    long mins = Math.max(0, Duration.between(a.getPlannedStartTime(), a.getPlannedEndTime()).toMinutes() - breakMin);
                    double shiftHours = mins / 60.0;
                    totalChainHours += shiftHours;
                    if (!isExternal) {
                        branchHours += shiftHours;
                    }
                }

                ShiftAssignmentDto dto = assignmentService.toDto(a);
                dto.setBranchId(aBranchId);
                dto.setBranchName(aBranchName);
                dto.setIsExternal(isExternal);
                dto.setReadOnly(isExternal);
                dtoList.add(dto);
            }

            empDto.setBranchHours(Math.round(branchHours * 10.0) / 10.0);
            empDto.setTotalChainHours(Math.round(totalChainHours * 10.0) / 10.0);
            empDto.setWeeklyScheduledHours(Math.round(branchHours * 10.0) / 10.0);
            empDto.setHasMultiBranch(hasExternal || !emp.getBranchId().equals(branchId) || secondaryEmpIds.contains(emp.getId()));
            empDto.setAssignments(dtoList);
            employeeDtos.add(empDto);
        }
        response.setEmployees(employeeDtos);

        // Holidays
        List<CompanyHoliday> holidays = holidayRepository.findAllByHolidayDateBetween(monday, sunday);
        response.setHolidays(holidays.stream()
                .map(h -> new WeeklyScheduleResponse.HolidayDto(h.getHolidayDate(), h.getHolidayName()))
                .collect(Collectors.toList()));

        // Templates (Scoped to current branch or global)
        response.setShiftTemplates(workShiftService.getAllWorkShifts(branchId));

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
                    item.getExcludeAssignmentId(),
                    null,
                    request.getBranchId()
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
        return assignmentService.assignSingleShift(request, currentUserId);
    }

    @Transactional
    public ShiftAssignmentDto claimShift(ClaimShiftRequest request, Long currentUserId) {
        return assignmentService.claimShift(request, currentUserId);
    }

    @Transactional
    public void cancelClaimedShift(Long assignmentId, Long currentUserId) {
        assignmentService.cancelClaimedShift(assignmentId, currentUserId);
    }

    @Transactional
    public List<ShiftAssignmentDto> bulkAssign(BulkAssignRequest request, Long currentUserId) {
        return assignmentService.bulkAssign(request, currentUserId);
    }

    @Transactional
    public List<ShiftAssignmentDto> batchAssignShifts(BatchAssignItemsRequest request, Long currentUserId) {
        return assignmentService.batchAssignShifts(request, currentUserId);
    }

    @Transactional
    public void deleteAssignment(Long id, Integer scheduleVersion, Long currentUserId) {
        assignmentService.deleteAssignment(id, scheduleVersion, currentUserId);
    }

    @Transactional
    public void resetWeeklySchedule(Long scheduleId, Integer scheduleVersion, Long currentUserId) {
        assignmentService.resetWeeklySchedule(scheduleId, scheduleVersion, currentUserId);
    }

    @Transactional
    public ShiftAssignmentDto updateOverrideReason(Long id, UpdateOverrideReasonRequest request, Long currentUserId) {
        return assignmentService.updateOverrideReason(id, request, currentUserId);
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

        return getWeeklySchedule(saved.getBranchId(), saved.getStartDate());
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

        return getWeeklySchedule(saved.getBranchId(), saved.getStartDate());
    }

    @Transactional
    public CopyWeekResponse copyScheduleWeek(CopyWeekRequest request, Long currentUserId) {
        return copyWeekService.copyScheduleWeek(request, currentUserId);
    }

    @Transactional(readOnly = true)
    public EmployeeMonthlyScheduleDto getEmployeeMonthlySchedule(Long employeeId, String monthStr) {
        Employee employee = employeeRepository.findById(employeeId)
                .filter(e -> e.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + employeeId));

        YearMonth targetMonth;
        try {
            if (monthStr != null && !monthStr.trim().isEmpty()) {
                targetMonth = YearMonth.parse(monthStr.trim());
            } else {
                targetMonth = YearMonth.now();
            }
        } catch (DateTimeParseException e) {
            targetMonth = YearMonth.now();
        }

        // Calculate earliest available month bounded by employee.hireDate and branch.openedDate
        YearMonth hireMonth = employee.getHireDate() != null ? YearMonth.from(employee.getHireDate()) : YearMonth.now();
        YearMonth branchMonth = hireMonth;
        if (employee.getBranchId() != null) {
            Optional<Branch> branchOpt = branchRepository.findByIdAndDeletedAtIsNull(employee.getBranchId());
            if (branchOpt.isPresent()) {
                LocalDate bDate = branchOpt.get().getOpenedDate() != null
                        ? branchOpt.get().getOpenedDate()
                        : (branchOpt.get().getCreatedAt() != null ? branchOpt.get().getCreatedAt().toLocalDate() : null);
                if (bDate != null) {
                    YearMonth bMonth = YearMonth.from(bDate);
                    if (bMonth.isAfter(branchMonth)) {
                        branchMonth = bMonth;
                    }
                }
            }
        }
        YearMonth earliestMonth = hireMonth.isAfter(branchMonth) ? hireMonth : branchMonth;

        LocalDate startDate = targetMonth.atDay(1);
        LocalDate endDate = targetMonth.atEndOfMonth();

        List<ShiftAssignment> assignments = assignmentRepository.findAllByEmployeeIdAndWorkDateBetween(employeeId, startDate, endDate);

        List<ShiftAssignment> validAssignments = assignments.stream()
                .filter(a -> !"CANCELLED".equalsIgnoreCase(a.getStatus()))
                .sorted(Comparator.comparing(ShiftAssignment::getWorkDate)
                        .thenComparing(ShiftAssignment::getSnapshotStartTime))
                .collect(Collectors.toList());

        double totalHours = 0.0;
        for (ShiftAssignment a : validAssignments) {
            if (a.getPlannedStartTime() != null && a.getPlannedEndTime() != null) {
                long minutes = Duration.between(a.getPlannedStartTime(), a.getPlannedEndTime()).toMinutes();
                int breakMin = a.getSnapshotBreakMinutes() != null ? a.getSnapshotBreakMinutes() : 0;
                long workMinutes = Math.max(0, minutes - breakMin);
                totalHours += workMinutes / 60.0;
            }
        }
        totalHours = Math.round(totalHours * 10.0) / 10.0;

        List<ShiftAssignmentDto> shiftDtos = validAssignments.stream()
                .map(assignmentService::toDto)
                .collect(Collectors.toList());

        return EmployeeMonthlyScheduleDto.builder()
                .employeeId(employeeId)
                .month(targetMonth.toString())
                .totalShifts(validAssignments.size())
                .totalHours(totalHours)
                .earliestAvailableMonth(earliestMonth.toString())
                .shifts(shiftDtos)
                .build();
    }

    public ShiftAssignmentDto toDto(ShiftAssignment a) {
        return assignmentService.toDto(a);
    }
}
