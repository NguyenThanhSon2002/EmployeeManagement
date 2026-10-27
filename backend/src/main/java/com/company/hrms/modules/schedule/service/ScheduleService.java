package com.company.hrms.modules.schedule.service;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.branch.domain.Branch;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.employee.repository.EmployeeSecondaryBranchRepository;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
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

@Service
public class ScheduleService {

    private static final Logger log = LoggerFactory.getLogger(ScheduleService.class);

    private final ScheduleRepository scheduleRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final ScheduleChangeHistoryRepository historyRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeSecondaryBranchRepository secondaryBranchRepository;
    private final WorkShiftRepository workShiftRepository;
    private final WorkShiftService workShiftService;
    private final CompanyHolidayRepository holidayRepository;
    private final ConflictDetectionEngine conflictEngine;

    public ScheduleService(
            ScheduleRepository scheduleRepository,
            ShiftAssignmentRepository assignmentRepository,
            ScheduleChangeHistoryRepository historyRepository,
            BranchRepository branchRepository,
            EmployeeRepository employeeRepository,
            EmployeeSecondaryBranchRepository secondaryBranchRepository,
            WorkShiftRepository workShiftRepository,
            WorkShiftService workShiftService,
            CompanyHolidayRepository holidayRepository,
            ConflictDetectionEngine conflictEngine) {
        this.scheduleRepository = scheduleRepository;
        this.assignmentRepository = assignmentRepository;
        this.historyRepository = historyRepository;
        this.branchRepository = branchRepository;
        this.employeeRepository = employeeRepository;
        this.secondaryBranchRepository = secondaryBranchRepository;
        this.workShiftRepository = workShiftRepository;
        this.workShiftService = workShiftService;
        this.holidayRepository = holidayRepository;
        this.conflictEngine = conflictEngine;
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

        List<ShiftAssignment> thisScheduleAssignments = assignmentRepository.findAllByScheduleId(schedule.getId());
        
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

                ShiftAssignmentDto dto = toDto(a);
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

    private void assertScheduleNotLocked(Schedule schedule) {
        if ("PUBLISHED".equalsIgnoreCase(schedule.getStatus())) {
            throw new BusinessException(
                    "SCHEDULE_LOCKED",
                    "Lịch làm việc đã được công bố chính thức và đang bị khóa. Chỉ Giám đốc hoặc Admin mới có quyền thu hồi về bản nháp để điều chỉnh.",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    @Transactional
    public ShiftAssignmentDto assignSingleShift(AssignSingleShiftRequest request, Long currentUserId) {
        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", request.getScheduleId()));

        assertScheduleNotLocked(schedule);

        if (request.getScheduleVersion() != null && !schedule.getVersion().equals(request.getScheduleVersion())) {
            throw new ObjectOptimisticLockingFailureException(Schedule.class, schedule.getId());
        }

        if (currentUserId != null && currentUserId > 1L) {
            Employee actor = employeeRepository.findByUserIdAndDeletedAtIsNull(currentUserId).orElse(null);
            if (actor != null && actor.getPositionId() != null && actor.getPositionId() == 2) { // ROLE_MANAGER
                if (!schedule.getBranchId().equals(actor.getBranchId())) {
                    throw new BusinessException("FORBIDDEN", "Quản lý không có quyền gán ca cho lịch làm việc thuộc cơ sở khác.", HttpStatus.FORBIDDEN);
                }
            }
        }

        WorkShift shift = workShiftRepository.findByIdAndDeletedAtIsNull(request.getWorkShiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Mẫu ca làm việc", request.getWorkShiftId()));

        Employee targetEmp = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", request.getEmployeeId()));
        if (targetEmp.getPositionId() != null && targetEmp.getPositionId() == 1L) {
            throw new BusinessException("DIRECTOR_CANNOT_BE_SCHEDULED", "Không thể phân ca làm việc cho nhân sự có chức danh Giám đốc.", HttpStatus.BAD_REQUEST);
        }

        ConflictValidationResult validation = conflictEngine.validateAssignment(
                request.getEmployeeId(),
                request.getWorkShiftId(),
                request.getWorkDate(),
                null,
                schedule.getId(),
                schedule.getBranchId()
        );

        if (validation.getHasMandatoryErrors()) {
            ScheduleConflictDto err = validation.getMandatoryErrors().get(0);
            throw new BusinessException(err.getRuleCode(), err.getMessage(), HttpStatus.UNPROCESSABLE_ENTITY);
        }

        String warningRule = null;
        if (validation.getHasWarnings()) {
            warningRule = validation.getWarnings().get(0).getRuleCode();
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
        assignment.setOverrideRule(request.getOverrideRule() != null ? request.getOverrideRule() : warningRule);
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

        assertScheduleNotLocked(schedule);

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
    public List<ShiftAssignmentDto> batchAssignShifts(BatchAssignItemsRequest request, Long currentUserId) {
        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", request.getScheduleId()));

        assertScheduleNotLocked(schedule);

        if (request.getScheduleVersion() != null && !schedule.getVersion().equals(request.getScheduleVersion())) {
            throw new ObjectOptimisticLockingFailureException(Schedule.class, schedule.getId());
        }

        boolean isReplaceAll = request.getMode() == null || "REPLACE_ALL".equalsIgnoreCase(request.getMode());

        if (isReplaceAll) {
            LocalDate start = request.getFromDate() != null ? request.getFromDate() : schedule.getStartDate();
            LocalDate end = request.getToDate() != null ? request.getToDate() : schedule.getEndDate();
            List<ShiftAssignment> inRange = assignmentRepository.findAllByScheduleId(schedule.getId()).stream()
                    .filter(a -> a.getWorkDate() != null && !a.getWorkDate().isBefore(start) && !a.getWorkDate().isAfter(end))
                    .toList();
            if (!inRange.isEmpty()) {
                assignmentRepository.deleteAll(inRange);
            }
        }

        // Preload existing assignments for this schedule to avoid duplicates
        List<ShiftAssignment> existingList = assignmentRepository.findAllByScheduleId(schedule.getId());
        Map<String, ShiftAssignment> existingMap = new HashMap<>();
        for (ShiftAssignment sa : existingList) {
            if (!"CANCELLED".equalsIgnoreCase(sa.getStatus())) {
                String key = sa.getEmployeeId() + "_" + sa.getWorkShiftId() + "_" + sa.getWorkDate();
                existingMap.put(key, sa);
            }
        }

        // Cache work shifts
        Set<Long> shiftIds = request.getAssignments().stream()
                .map(BatchAssignItemsRequest.AssignItem::getWorkShiftId)
                .collect(Collectors.toSet());
        Map<Long, WorkShift> shiftMap = workShiftRepository.findAllById(shiftIds).stream()
                .collect(Collectors.toMap(WorkShift::getId, s -> s));

        // Cache employees to exclude Director
        Set<Long> empIds = request.getAssignments().stream()
                .map(BatchAssignItemsRequest.AssignItem::getEmployeeId)
                .collect(Collectors.toSet());
        Map<Long, Employee> empMap = employeeRepository.findAllById(empIds).stream()
                .collect(Collectors.toMap(Employee::getId, e -> e));

        List<ShiftAssignment> toSave = new ArrayList<>();
        for (BatchAssignItemsRequest.AssignItem item : request.getAssignments()) {
            Employee emp = empMap.get(item.getEmployeeId());
            if (emp != null && emp.getPositionId() != null && emp.getPositionId() == 1L) {
                // Giám đốc không tham gia trực ca
                continue;
            }
            WorkShift shift = shiftMap.get(item.getWorkShiftId());
            if (shift == null) {
                shift = workShiftRepository.findByIdAndDeletedAtIsNull(item.getWorkShiftId())
                        .orElseThrow(() -> new ResourceNotFoundException("Mẫu ca làm việc", item.getWorkShiftId()));
                shiftMap.put(shift.getId(), shift);
            }

            String key = item.getEmployeeId() + "_" + item.getWorkShiftId() + "_" + item.getWorkDate();
            ShiftAssignment target = existingMap.get(key);

            LocalDateTime[] times = ConflictDetectionEngine.calculatePlannedTimes(
                    item.getWorkDate(),
                    shift.getStartTime(),
                    shift.getEndTime(),
                    Boolean.TRUE.equals(shift.getIsCrossMidnight())
            );

            if (target != null) {
                // Update existing assignment
                target.setSnapshotShiftName(shift.getShiftName());
                target.setSnapshotStartTime(shift.getStartTime());
                target.setSnapshotEndTime(shift.getEndTime());
                target.setSnapshotBreakMinutes(shift.getBreakMinutes());
                target.setSnapshotCrossMidnight(shift.getIsCrossMidnight());
                target.setSnapshotColorCode(shift.getColorCode());
                target.setPlannedStartTime(times[0]);
                target.setPlannedEndTime(times[1]);
                target.setStatus("ASSIGNED");
                target.setOverrideRule(item.getOverrideRule());
                target.setOverrideReason(item.getOverrideReason());
                toSave.add(target);
            } else {
                // Create new assignment
                ShiftAssignment assignment = new ShiftAssignment();
                assignment.setScheduleId(schedule.getId());
                assignment.setEmployeeId(item.getEmployeeId());
                assignment.setWorkShiftId(shift.getId());
                assignment.setWorkDate(item.getWorkDate());
                assignment.setSnapshotShiftName(shift.getShiftName());
                assignment.setSnapshotStartTime(shift.getStartTime());
                assignment.setSnapshotEndTime(shift.getEndTime());
                assignment.setSnapshotBreakMinutes(shift.getBreakMinutes());
                assignment.setSnapshotCrossMidnight(shift.getIsCrossMidnight());
                assignment.setSnapshotColorCode(shift.getColorCode());
                assignment.setPlannedStartTime(times[0]);
                assignment.setPlannedEndTime(times[1]);
                assignment.setStatus("ASSIGNED");
                assignment.setOverrideRule(item.getOverrideRule());
                assignment.setOverrideReason(item.getOverrideReason());
                toSave.add(assignment);
                existingMap.put(key, assignment);
            }
        }

        List<ShiftAssignment> saved = assignmentRepository.saveAll(toSave);

        schedule.setVersion(schedule.getVersion() + 1);
        scheduleRepository.save(schedule);

        if ("PUBLISHED".equalsIgnoreCase(schedule.getStatus())) {
            for (ShiftAssignment sa : saved) {
                historyRepository.save(new ScheduleChangeHistory(
                        schedule.getId(),
                        sa.getId(),
                        "CREATE",
                        null,
                        "Gán phân ca tự động hàng loạt: " + sa.getSnapshotShiftName(),
                        "Xếp ca tự động",
                        currentUserId != null ? currentUserId : 1L
                ));
            }
        }

        return saved.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public void deleteAssignment(Long id, Integer scheduleVersion, Long currentUserId) {
        ShiftAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Phân ca", id));

        Schedule schedule = scheduleRepository.findById(assignment.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", assignment.getScheduleId()));

        assertScheduleNotLocked(schedule);

        if (scheduleVersion != null && !schedule.getVersion().equals(scheduleVersion)) {
            throw new ObjectOptimisticLockingFailureException(Schedule.class, schedule.getId());
        }

        // Kiểm tra quyền hạn quản lý: Quản lý không được xóa ca của cơ sở khác
        if (currentUserId != null && currentUserId > 1L) {
            Employee actor = employeeRepository.findByUserIdAndDeletedAtIsNull(currentUserId).orElse(null);
            if (actor != null && actor.getPositionId() != null && actor.getPositionId() == 2) { // ROLE_MANAGER
                if (!schedule.getBranchId().equals(actor.getBranchId())) {
                    throw new BusinessException("FORBIDDEN", "Quản lý không có quyền xóa ca làm việc thuộc cơ sở khác.", HttpStatus.FORBIDDEN);
                }
            }
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
    public ShiftAssignmentDto updateOverrideReason(Long id, UpdateOverrideReasonRequest request, Long currentUserId) {
        ShiftAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Phân ca", id));

        Schedule schedule = scheduleRepository.findById(assignment.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", assignment.getScheduleId()));

        assertScheduleNotLocked(schedule);

        // Không block việc cập nhật ghi chú giải trình nếu scheduleVersion có độ lệch nhẹ giữa client và server
        if (request.getScheduleVersion() != null && !schedule.getVersion().equals(request.getScheduleVersion())) {
            log.warn("Schedule version mismatch on override update for assignment {}: client={}, server={}",
                    id, request.getScheduleVersion(), schedule.getVersion());
        }

        // Kiểm tra quyền hạn quản lý: Quản lý không được sửa ca của cơ sở khác
        if (currentUserId != null && currentUserId > 1L) {
            Employee actor = employeeRepository.findByUserIdAndDeletedAtIsNull(currentUserId).orElse(null);
            if (actor != null && actor.getPositionId() != null && actor.getPositionId() == 2) { // ROLE_MANAGER
                if (!schedule.getBranchId().equals(actor.getBranchId())) {
                    throw new BusinessException("FORBIDDEN", "Quản lý không có quyền cập nhật ca làm việc thuộc cơ sở khác.", HttpStatus.FORBIDDEN);
                }
            }
        }

        String rawReason = request.getOverrideReason();
        String cleanedReason = (rawReason != null && !rawReason.trim().isEmpty()) ? rawReason.trim() : null;
        assignment.setOverrideReason(cleanedReason);

        if (request.getOverrideRule() != null) {
            assignment.setOverrideRule(request.getOverrideRule().trim().isEmpty() ? null : request.getOverrideRule().trim());
        }

        ShiftAssignment saved = assignmentRepository.save(assignment);

        if ("PUBLISHED".equalsIgnoreCase(schedule.getStatus())) {
            historyRepository.save(new ScheduleChangeHistory(
                    schedule.getId(),
                    saved.getId(),
                    "UPDATE_OVERRIDE",
                    null,
                    cleanedReason != null ? ("Cập nhật giải trình ca: " + assignment.getSnapshotShiftName()) : ("Xóa giải trình ca: " + assignment.getSnapshotShiftName()),
                    cleanedReason,
                    currentUserId != null ? currentUserId : 1L
            ));
        }

        schedule.setVersion(schedule.getVersion() + 1);
        scheduleRepository.save(schedule);

        return toDto(saved);
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
        Long branchId = request.getBranchId();
        LocalDate sourceStart = request.getSourceStartDate().with(DayOfWeek.MONDAY);
        LocalDate targetStart = request.getTargetStartDate().with(DayOfWeek.MONDAY);
        LocalDate targetEnd = targetStart.plusDays(6);
        String mode = request.getMode() != null ? request.getMode().toUpperCase() : "SKIP_OCCUPIED";

        // 1. Tìm hoặc tạo lịch làm việc cho tuần đích
        Schedule targetSchedule = scheduleRepository.findByBranchIdAndStartDate(branchId, targetStart)
                .orElseGet(() -> {
                    Schedule s = new Schedule(branchId, targetStart, targetEnd);
                    return scheduleRepository.save(s);
                });

        if ("PUBLISHED".equalsIgnoreCase(targetSchedule.getStatus())) {
            throw new BusinessException("SCHEDULE_ALREADY_PUBLISHED", "Lịch tuần đích đã được công bố chính thức, không thể sao chép đè.", HttpStatus.BAD_REQUEST);
        }

        // 2. Tìm lịch tuần nguồn
        Schedule sourceSchedule = scheduleRepository.findByBranchIdAndStartDate(branchId, sourceStart).orElse(null);
        if (sourceSchedule == null) {
            return CopyWeekResponse.builder()
                    .copiedCount(0)
                    .skippedCount(0)
                    .targetScheduleId(targetSchedule.getId())
                    .message("Tuần trước chưa có dữ liệu lịch làm việc để sao chép.")
                    .build();
        }

        List<ShiftAssignment> sourceAssignments = assignmentRepository.findAllByScheduleId(sourceSchedule.getId());
        List<ShiftAssignment> validSourceAssignments = sourceAssignments.stream()
                .filter(a -> !"CANCELLED".equalsIgnoreCase(a.getStatus()))
                .toList();

        if (validSourceAssignments.isEmpty()) {
            return CopyWeekResponse.builder()
                    .copiedCount(0)
                    .skippedCount(0)
                    .targetScheduleId(targetSchedule.getId())
                    .message("Tuần trước không có ca làm việc nào để sao chép.")
                    .build();
        }

        // 3. Tính độ lệch ngày giữa 2 tuần (mặc định 7 ngày)
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(sourceStart, targetStart);

        List<ShiftAssignment> targetAssignments = assignmentRepository.findAllByScheduleId(targetSchedule.getId());

        int copiedCount = 0;
        int skippedCount = 0;
        List<ShiftAssignment> toSave = new ArrayList<>();

        if ("REPLACE_ALL".equals(mode)) {
            // Xóa sạch toàn bộ ca hiện có của tuần đích
            if (!targetAssignments.isEmpty()) {
                assignmentRepository.deleteAll(targetAssignments);
            }

            for (ShiftAssignment src : validSourceAssignments) {
                LocalDate newWorkDate = src.getWorkDate().plusDays(daysDiff);

                ShiftAssignment cloned = new ShiftAssignment();
                cloned.setScheduleId(targetSchedule.getId());
                cloned.setEmployeeId(src.getEmployeeId());
                cloned.setWorkShiftId(src.getWorkShiftId());
                cloned.setWorkDate(newWorkDate);
                cloned.setSnapshotShiftName(src.getSnapshotShiftName());
                cloned.setSnapshotStartTime(src.getSnapshotStartTime());
                cloned.setSnapshotEndTime(src.getSnapshotEndTime());
                cloned.setSnapshotBreakMinutes(src.getSnapshotBreakMinutes());
                cloned.setSnapshotCrossMidnight(src.getSnapshotCrossMidnight());
                cloned.setSnapshotColorCode(src.getSnapshotColorCode());

                LocalDateTime plannedStart = LocalDateTime.of(newWorkDate, src.getSnapshotStartTime());
                LocalDateTime plannedEnd = src.getSnapshotCrossMidnight()
                        ? LocalDateTime.of(newWorkDate.plusDays(1), src.getSnapshotEndTime())
                        : LocalDateTime.of(newWorkDate, src.getSnapshotEndTime());
                cloned.setPlannedStartTime(plannedStart);
                cloned.setPlannedEndTime(plannedEnd);
                cloned.setStatus("ASSIGNED");

                toSave.add(cloned);
                copiedCount++;
            }
        } else {
            // SKIP_OCCUPIED: Giữ ca đã có, chỉ chép vào các ô chưa có
            Set<String> occupiedKeys = new HashSet<>();
            for (ShiftAssignment ta : targetAssignments) {
                if (!"CANCELLED".equalsIgnoreCase(ta.getStatus())) {
                    // Tránh gán trùng cùng nhân viên, cùng ngày và cùng ca
                    occupiedKeys.add(ta.getEmployeeId() + "_" + ta.getWorkDate() + "_" + ta.getWorkShiftId());
                }
            }

            for (ShiftAssignment src : validSourceAssignments) {
                LocalDate newWorkDate = src.getWorkDate().plusDays(daysDiff);
                String checkKey = src.getEmployeeId() + "_" + newWorkDate + "_" + src.getWorkShiftId();

                if (occupiedKeys.contains(checkKey)) {
                    skippedCount++;
                    continue;
                }

                ShiftAssignment cloned = new ShiftAssignment();
                cloned.setScheduleId(targetSchedule.getId());
                cloned.setEmployeeId(src.getEmployeeId());
                cloned.setWorkShiftId(src.getWorkShiftId());
                cloned.setWorkDate(newWorkDate);
                cloned.setSnapshotShiftName(src.getSnapshotShiftName());
                cloned.setSnapshotStartTime(src.getSnapshotStartTime());
                cloned.setSnapshotEndTime(src.getSnapshotEndTime());
                cloned.setSnapshotBreakMinutes(src.getSnapshotBreakMinutes());
                cloned.setSnapshotCrossMidnight(src.getSnapshotCrossMidnight());
                cloned.setSnapshotColorCode(src.getSnapshotColorCode());

                LocalDateTime plannedStart = LocalDateTime.of(newWorkDate, src.getSnapshotStartTime());
                LocalDateTime plannedEnd = src.getSnapshotCrossMidnight()
                        ? LocalDateTime.of(newWorkDate.plusDays(1), src.getSnapshotEndTime())
                        : LocalDateTime.of(newWorkDate, src.getSnapshotEndTime());
                cloned.setPlannedStartTime(plannedStart);
                cloned.setPlannedEndTime(plannedEnd);
                cloned.setStatus("ASSIGNED");

                toSave.add(cloned);
                occupiedKeys.add(checkKey);
                copiedCount++;
            }
        }

        if (!toSave.isEmpty()) {
            assignmentRepository.saveAll(toSave);
        }

        targetSchedule.setVersion(targetSchedule.getVersion() + 1);
        scheduleRepository.save(targetSchedule);

        return CopyWeekResponse.builder()
                .copiedCount(copiedCount)
                .skippedCount(skippedCount)
                .targetScheduleId(targetSchedule.getId())
                .message("Sao chép thành công " + copiedCount + " ca làm việc (Bỏ qua " + skippedCount + " ca đã có).")
                .build();
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
        // Round to 1 decimal place
        totalHours = Math.round(totalHours * 10.0) / 10.0;

        List<ShiftAssignmentDto> shiftDtos = validAssignments.stream()
                .map(this::toDto)
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

        if (a.getScheduleId() != null) {
            scheduleRepository.findById(a.getScheduleId()).ifPresent(s -> {
                dto.setBranchId(s.getBranchId());
                if (s.getBranchId() != null) {
                    branchRepository.findByIdAndDeletedAtIsNull(s.getBranchId())
                            .ifPresent(b -> dto.setBranchName(b.getBranchName()));
                }
            });
        }
        return dto;
    }
}
