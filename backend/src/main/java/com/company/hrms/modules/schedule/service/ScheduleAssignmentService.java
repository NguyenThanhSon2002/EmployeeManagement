package com.company.hrms.modules.schedule.service;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import com.company.hrms.modules.employee.repository.EmployeeSecondaryBranchRepository;
import com.company.hrms.modules.schedule.domain.Schedule;
import com.company.hrms.modules.schedule.domain.ScheduleChangeHistory;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.*;
import com.company.hrms.modules.schedule.engine.ConflictDetectionEngine;
import com.company.hrms.modules.schedule.repository.ScheduleChangeHistoryRepository;
import com.company.hrms.modules.schedule.repository.ScheduleRepository;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import com.company.hrms.modules.shift.domain.WorkShift;
import com.company.hrms.modules.shift.repository.WorkShiftRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service chuyên biệt chịu trách nhiệm quản lý các phân công ca làm việc (Shift Assignment).
 * Bao gồm: gán ca đơn lẻ, nhân viên tự nhận ca, hủy nhận ca, gán hàng loạt, xóa ca và cập nhật giải trình vi phạm.
 */
@Service
public class ScheduleAssignmentService {

    private static final Logger log = LoggerFactory.getLogger(ScheduleAssignmentService.class);
    private static final Set<String> IGNORED_CLAIM_WARNINGS =
            Set.of("WARN_WEEKLY_HOURS_EXCEEDED", "WARN_HOLIDAY_ASSIGNMENT");

    private final ScheduleRepository scheduleRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final ScheduleChangeHistoryRepository historyRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeSecondaryBranchRepository secondaryBranchRepository;
    private final WorkShiftRepository workShiftRepository;
    private final ConflictDetectionEngine conflictEngine;

    public ScheduleAssignmentService(
            ScheduleRepository scheduleRepository,
            ShiftAssignmentRepository assignmentRepository,
            ScheduleChangeHistoryRepository historyRepository,
            BranchRepository branchRepository,
            EmployeeRepository employeeRepository,
            EmployeeSecondaryBranchRepository secondaryBranchRepository,
            WorkShiftRepository workShiftRepository,
            ConflictDetectionEngine conflictEngine) {
        this.scheduleRepository = scheduleRepository;
        this.assignmentRepository = assignmentRepository;
        this.historyRepository = historyRepository;
        this.branchRepository = branchRepository;
        this.employeeRepository = employeeRepository;
        this.secondaryBranchRepository = secondaryBranchRepository;
        this.workShiftRepository = workShiftRepository;
        this.conflictEngine = conflictEngine;
    }

    public void assertScheduleNotLocked(Schedule schedule) {
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

        if (shift.getBranchId() != null && !shift.getBranchId().equals(schedule.getBranchId())) {
            throw new BusinessException("BRANCH_SHIFT_MISMATCH", "Mẫu ca làm việc (" + shift.getShiftName() + ") không thuộc chi nhánh của lịch làm việc.", HttpStatus.BAD_REQUEST);
        }

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
    public ShiftAssignmentDto claimShift(ClaimShiftRequest request, Long currentUserId) {
        Schedule schedule = scheduleRepository.findByIdForUpdate(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", request.getScheduleId()));

        Employee emp = employeeRepository.findByUserIdAndDeletedAtIsNull(currentUserId)
                .orElseThrow(() -> new BusinessException("EMPLOYEE_NOT_FOUND", "Không tìm thấy hồ sơ nhân sự của bạn trong hệ thống.", HttpStatus.NOT_FOUND));

        if (emp.getPositionId() != null && emp.getPositionId() == 1L) {
            throw new BusinessException("DIRECTOR_CANNOT_BE_SCHEDULED", "Không thể phân ca làm việc cho Giám đốc.", HttpStatus.BAD_REQUEST);
        }

        boolean allowedInBranch = schedule.getBranchId().equals(emp.getBranchId())
                || secondaryBranchRepository.existsByEmployeeIdAndBranchId(emp.getId(), schedule.getBranchId());
        if (!allowedInBranch) {
            throw new BusinessException("BRANCH_MISMATCH", "Bạn chỉ được đăng ký ca làm việc thuộc cơ sở của bạn phụ trách.", HttpStatus.FORBIDDEN);
        }

        WorkShift shift = workShiftRepository.findByIdAndDeletedAtIsNull(request.getWorkShiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Mẫu ca làm việc", request.getWorkShiftId()));

        if (shift.getBranchId() != null && !shift.getBranchId().equals(schedule.getBranchId())) {
            throw new BusinessException("BRANCH_SHIFT_MISMATCH", "Mẫu ca làm việc không thuộc chi nhánh của lịch làm việc.", HttpStatus.BAD_REQUEST);
        }

        List<ShiftAssignment> existingInShift = assignmentRepository.findAssignmentsByShiftAndDate(
                schedule.getId(), shift.getId(), request.getWorkDate()
        );

        boolean alreadyAssigned = existingInShift.stream()
                .anyMatch(a -> a.getEmployeeId().equals(emp.getId()));
        if (alreadyAssigned) {
            throw new BusinessException("ALREADY_ASSIGNED", "Bạn đã được phân công vào ca làm việc này rồi.", HttpStatus.BAD_REQUEST);
        }

        int maxCapacity = shift.getMaxStaffing() != null ? shift.getMaxStaffing() : (shift.getMinStaffing() != null ? shift.getMinStaffing() : 1);
        if (existingInShift.size() >= maxCapacity) {
            throw new BusinessException("SHIFT_FULL", "Ca làm việc đã đủ định biên nhân sự tối đa (" + existingInShift.size() + "/" + maxCapacity + " NV).", HttpStatus.BAD_REQUEST);
        }

        ConflictValidationResult validation = conflictEngine.validateAssignment(
                emp.getId(),
                shift.getId(),
                request.getWorkDate(),
                null,
                schedule.getId(),
                schedule.getBranchId()
        );

        if (validation.getHasMandatoryErrors()) {
            ScheduleConflictDto err = validation.getMandatoryErrors().get(0);
            throw new BusinessException(err.getRuleCode(), err.getMessage(), HttpStatus.UNPROCESSABLE_ENTITY);
        }

        List<ScheduleConflictDto> claimWarnings = validation.getWarnings().stream()
                .filter(w -> !IGNORED_CLAIM_WARNINGS.contains(w.getRuleCode()))
                .toList();

        if (!claimWarnings.isEmpty() && !Boolean.TRUE.equals(request.getSelfVolunteeredConfirm())) {
            ScheduleConflictDto warn = claimWarnings.get(0);
            throw new BusinessException("WARN_VOLUNTEER_CONFIRMATION_REQUIRED",
                    warn.getMessage(), HttpStatus.BAD_REQUEST);
        }

        LocalDateTime[] times = ConflictDetectionEngine.calculatePlannedTimes(
                request.getWorkDate(),
                shift.getStartTime(),
                shift.getEndTime(),
                Boolean.TRUE.equals(shift.getIsCrossMidnight())
        );

        ShiftAssignment assignment = new ShiftAssignment();
        assignment.setScheduleId(schedule.getId());
        assignment.setEmployeeId(emp.getId());
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
        assignment.setSource("SELF_CLAIM");

        String overrideRule = !claimWarnings.isEmpty() ? claimWarnings.get(0).getRuleCode() : null;
        String overrideReason = Boolean.TRUE.equals(request.getSelfVolunteeredConfirm())
                ? "Nhân viên tự nguyện đăng ký nhận ca"
                : "Nhân viên đăng ký nhận ca trống";

        assignment.setOverrideRule(overrideRule);
        assignment.setOverrideReason(overrideReason);

        ShiftAssignment saved = assignmentRepository.save(assignment);

        schedule.setVersion(schedule.getVersion() + 1);
        scheduleRepository.save(schedule);

        if ("PUBLISHED".equalsIgnoreCase(schedule.getStatus())) {
            historyRepository.save(new ScheduleChangeHistory(
                    schedule.getId(),
                    saved.getId(),
                    "CREATE",
                    null,
                    "Nhân viên tự nhận ca: " + shift.getShiftName(),
                    overrideReason,
                    currentUserId != null ? currentUserId : 1L
            ));
        }

        return toDto(saved);
    }

    @Transactional
    public void cancelClaimedShift(Long assignmentId, Long currentUserId) {
        ShiftAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Phân ca", assignmentId));

        Employee emp = employeeRepository.findByUserIdAndDeletedAtIsNull(currentUserId)
                .orElseThrow(() -> new BusinessException("EMPLOYEE_NOT_FOUND", "Không tìm thấy hồ sơ nhân sự của bạn trong hệ thống.", HttpStatus.NOT_FOUND));

        if (!assignment.getEmployeeId().equals(emp.getId())) {
            throw new BusinessException("FORBIDDEN", "Bạn chỉ được phép hủy ca làm việc do chính mình đã đăng ký.", HttpStatus.FORBIDDEN);
        }

        if (!"SELF_CLAIM".equals(assignment.getSource())) {
            throw new BusinessException("NOT_SELF_CLAIMED",
                    "Ca này do quản lý phân công, bạn không thể tự hủy. Hãy dùng chức năng Nhường ca.", HttpStatus.FORBIDDEN);
        }

        Schedule schedule = scheduleRepository.findByIdForUpdate(assignment.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Lịch làm việc", assignment.getScheduleId()));

        if ("PUBLISHED".equalsIgnoreCase(schedule.getStatus())) {
            throw new BusinessException("SCHEDULE_PUBLISHED",
                    "Lịch đã được công bố nên bạn không thể tự hủy ca. Hãy dùng chức năng Nhường ca.", HttpStatus.FORBIDDEN);
        }

        LocalDateTime now = LocalDateTime.now();
        if (assignment.getPlannedStartTime() != null && assignment.getPlannedStartTime().isBefore(now)) {
            throw new BusinessException("PAST_SHIFT", "Không thể hủy ca làm việc đã diễn ra trong quá khứ.", HttpStatus.BAD_REQUEST);
        }

        assignmentRepository.delete(assignment);

        schedule.setVersion(schedule.getVersion() + 1);
        scheduleRepository.save(schedule);
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

        if (shift.getBranchId() != null && !shift.getBranchId().equals(schedule.getBranchId())) {
            throw new BusinessException("BRANCH_SHIFT_MISMATCH", "Mẫu ca làm việc (" + shift.getShiftName() + ") không thuộc chi nhánh của lịch làm việc.", HttpStatus.BAD_REQUEST);
        }

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

            if (shift.getBranchId() != null && !shift.getBranchId().equals(schedule.getBranchId())) {
                throw new BusinessException("BRANCH_SHIFT_MISMATCH", "Mẫu ca làm việc (" + shift.getShiftName() + ") không thuộc chi nhánh của lịch làm việc.", HttpStatus.BAD_REQUEST);
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

        if (assignment.getTransferredFromEmployeeId() != null ||
                (assignment.getOverrideReason() != null && assignment.getOverrideReason().contains("HANDOVER-"))) {
            throw new BusinessException("IMMUTABLE_OVERRIDE", "Không thể chỉnh sửa giải trình của ca đã được chuyển nhượng hoặc đổi qua hệ thống.", HttpStatus.BAD_REQUEST);
        }

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
        dto.setSource(a.getSource());
        dto.setOverrideRule(a.getOverrideRule());
        dto.setOverrideReason(a.getOverrideReason());
        dto.setVersion(a.getVersion());
        dto.setTransferredFromEmployeeId(a.getTransferredFromEmployeeId());

        if (a.getTransferredFromEmployeeId() != null) {
            employeeRepository.findById(a.getTransferredFromEmployeeId()).ifPresent(emp -> {
                dto.setTransferredFromEmployeeName(emp.getFullName());
                dto.setTransferredFromEmployeeCode(emp.getEmployeeCode());
            });
        }

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
