package com.company.hrms.modules.employee.service;

import com.company.hrms.modules.availability.domain.EmployeeAvailability;
import com.company.hrms.modules.availability.domain.EmployeePreferredShift;
import com.company.hrms.modules.availability.repository.EmployeeAvailabilityRepository;
import com.company.hrms.modules.availability.repository.EmployeePreferredShiftRepository;
import com.company.hrms.modules.schedule.domain.Schedule;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.repository.ScheduleRepository;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import com.company.hrms.modules.shift.domain.WorkShift;
import com.company.hrms.modules.shift.repository.WorkShiftRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

/**
 * Service chuyên trách xử lý điều chuyển phân ca và lịch khả dụng của nhân viên
 * khi nhân viên chuyển cơ sở làm việc chính sang chi nhánh mới.
 */
@Service
public class EmployeeBranchMigrationService {

    private final ShiftAssignmentRepository assignmentRepository;
    private final ScheduleRepository scheduleRepository;
    private final WorkShiftRepository workShiftRepository;
    private final EmployeeAvailabilityRepository availabilityRepository;
    private final EmployeePreferredShiftRepository preferredShiftRepository;

    public EmployeeBranchMigrationService(
            ShiftAssignmentRepository assignmentRepository,
            ScheduleRepository scheduleRepository,
            WorkShiftRepository workShiftRepository,
            EmployeeAvailabilityRepository availabilityRepository,
            EmployeePreferredShiftRepository preferredShiftRepository) {
        this.assignmentRepository = assignmentRepository;
        this.scheduleRepository = scheduleRepository;
        this.workShiftRepository = workShiftRepository;
        this.availabilityRepository = availabilityRepository;
        this.preferredShiftRepository = preferredShiftRepository;
    }

    /**
     * Tự động chuyển các phân công ca (từ tuần hiện tại trở đi) sang Lịch tuần và Mẫu ca tương ứng của chi nhánh mới.
     */
    @Transactional
    public void migrateEmployeeShiftsToNewBranch(Long employeeId, Long oldBranchId, Long newBranchId) {
        if (oldBranchId == null || newBranchId == null || oldBranchId.equals(newBranchId)) {
            return;
        }

        LocalDate currentMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<ShiftAssignment> futureAssignments = assignmentRepository.findAllByEmployeeIdAndWorkDateBetween(
                employeeId, currentMonday, currentMonday.plusYears(1)
        );

        if (futureAssignments.isEmpty()) {
            return;
        }

        List<WorkShift> newBranchShifts = workShiftRepository.findAllByBranchIdAndDeletedAtIsNullOrderByStartTimeAsc(newBranchId);
        if (newBranchShifts.isEmpty()) {
            return;
        }

        for (ShiftAssignment sa : futureAssignments) {
            if ("CANCELLED".equalsIgnoreCase(sa.getStatus())) {
                continue;
            }

            Schedule oldSched = scheduleRepository.findById(sa.getScheduleId()).orElse(null);
            if (oldSched == null || !oldBranchId.equals(oldSched.getBranchId())) {
                continue; // Chỉ chuyển ca thuộc về chi nhánh cũ sở tại của nhân viên
            }

            LocalDate workDate = sa.getWorkDate();
            LocalDate weekMonday = workDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            LocalDate weekSunday = weekMonday.plusDays(6);

            // Tìm hoặc tạo Schedule tuần của chi nhánh mới
            Schedule targetSchedule = scheduleRepository.findByBranchIdAndStartDate(newBranchId, weekMonday)
                    .orElseGet(() -> {
                        Schedule newSched = new Schedule();
                        newSched.setBranchId(newBranchId);
                        newSched.setStartDate(weekMonday);
                        newSched.setEndDate(weekSunday);
                        newSched.setStatus("DRAFT");
                        newSched.setVersion(1);
                        return scheduleRepository.save(newSched);
                    });

            // Khớp mẫu ca tương ứng ở chi nhánh mới
            WorkShift oldWs = workShiftRepository.findById(sa.getWorkShiftId()).orElse(null);
            WorkShift matchedWs = findMatchingWorkShift(oldWs, sa.getSnapshotShiftName(), newBranchShifts);

            if (matchedWs != null) {
                sa.setScheduleId(targetSchedule.getId());
                sa.setWorkShiftId(matchedWs.getId());
                sa.setSnapshotShiftName(matchedWs.getShiftName());
                sa.setSnapshotStartTime(matchedWs.getStartTime());
                sa.setSnapshotEndTime(matchedWs.getEndTime());
                sa.setSnapshotBreakMinutes(matchedWs.getBreakMinutes() != null ? matchedWs.getBreakMinutes() : 0);
                sa.setSnapshotCrossMidnight(Boolean.TRUE.equals(matchedWs.getIsCrossMidnight()));
                sa.setSnapshotColorCode(matchedWs.getColorCode());

                LocalDateTime plannedStart = LocalDateTime.of(workDate, matchedWs.getStartTime());
                LocalDateTime plannedEnd = Boolean.TRUE.equals(matchedWs.getIsCrossMidnight())
                        ? LocalDateTime.of(workDate.plusDays(1), matchedWs.getEndTime())
                        : LocalDateTime.of(workDate, matchedWs.getEndTime());
                sa.setPlannedStartTime(plannedStart);
                sa.setPlannedEndTime(plannedEnd);

                assignmentRepository.save(sa);
            }
        }
    }

    /**
     * Tự động điều chuyển lịch khả dụng và ca ưa thích sang chi nhánh mới khi chuyển cơ sở.
     */
    @Transactional
    public void migrateEmployeeAvailabilityToNewBranch(Long employeeId, Long oldBranchId, Long newBranchId) {
        if (oldBranchId == null || newBranchId == null || oldBranchId.equals(newBranchId)) {
            return;
        }

        List<WorkShift> newBranchShifts = workShiftRepository.findAllByBranchIdAndDeletedAtIsNullOrderByStartTimeAsc(newBranchId);
        if (newBranchShifts.isEmpty()) {
            return;
        }

        // 1. Remap employee_availabilities
        List<EmployeeAvailability> oldAvailabilities = availabilityRepository.findAllByEmployeeIdAndBranchId(employeeId, oldBranchId);
        List<EmployeeAvailability> currentNewAvailabilities = availabilityRepository.findAllByEmployeeIdAndBranchId(employeeId, newBranchId);

        for (EmployeeAvailability ea : oldAvailabilities) {
            WorkShift oldWs = workShiftRepository.findById(ea.getWorkShiftId()).orElse(null);
            if (oldWs == null) continue;

            WorkShift matchedWs = findMatchingWorkShift(oldWs, oldWs.getShiftName(), newBranchShifts);
            if (matchedWs != null) {
                Long targetShiftId = matchedWs.getId();
                boolean alreadyExists = currentNewAvailabilities.stream()
                        .anyMatch(existing -> existing.getWorkShiftId().equals(targetShiftId) && existing.getDayOfWeek().equals(ea.getDayOfWeek()));

                if (alreadyExists) {
                    availabilityRepository.delete(ea);
                } else {
                    ea.setWorkShiftId(targetShiftId);
                    availabilityRepository.save(ea);
                }
            }
        }

        // 2. Remap employee_preferred_shifts
        List<EmployeePreferredShift> oldPreferred = preferredShiftRepository.findAllByEmployeeIdAndBranchId(employeeId, oldBranchId);
        List<EmployeePreferredShift> currentNewPreferred = preferredShiftRepository.findAllByEmployeeIdAndBranchId(employeeId, newBranchId);

        for (EmployeePreferredShift eps : oldPreferred) {
            WorkShift oldWs = workShiftRepository.findById(eps.getWorkShiftId()).orElse(null);
            if (oldWs == null) continue;

            WorkShift matchedWs = findMatchingWorkShift(oldWs, oldWs.getShiftName(), newBranchShifts);
            if (matchedWs != null) {
                Long targetShiftId = matchedWs.getId();
                boolean alreadyExists = currentNewPreferred.stream()
                        .anyMatch(existing -> existing.getWorkShiftId().equals(targetShiftId));

                if (alreadyExists) {
                    preferredShiftRepository.delete(eps);
                } else {
                    eps.setWorkShiftId(targetShiftId);
                    preferredShiftRepository.save(eps);
                }
            }
        }
    }

    /**
     * Khớp mẫu ca tương ứng giữa 2 chi nhánh theo shiftCode hoặc shiftName.
     */
    public WorkShift findMatchingWorkShift(WorkShift oldWs, String fallbackShiftName, List<WorkShift> newBranchShifts) {
        if (newBranchShifts == null || newBranchShifts.isEmpty()) {
            return null;
        }

        // 1. Khớp theo shiftCode
        if (oldWs != null && oldWs.getShiftCode() != null && !oldWs.getShiftCode().isBlank()) {
            for (WorkShift ws : newBranchShifts) {
                if (oldWs.getShiftCode().equalsIgnoreCase(ws.getShiftCode())) {
                    return ws;
                }
            }
        }

        // 2. Khớp theo shiftName
        String shiftName = "";
        if (oldWs != null && oldWs.getShiftName() != null && !oldWs.getShiftName().isBlank()) {
            shiftName = oldWs.getShiftName().trim();
        } else if (fallbackShiftName != null && !fallbackShiftName.isBlank()) {
            shiftName = fallbackShiftName.trim();
        }

        if (!shiftName.isBlank()) {
            final String targetName = shiftName;
            for (WorkShift ws : newBranchShifts) {
                String wsName = ws.getShiftName() != null ? ws.getShiftName().trim() : "";
                if (wsName.equalsIgnoreCase(targetName)
                        || targetName.toLowerCase().startsWith(wsName.toLowerCase())
                        || wsName.toLowerCase().startsWith(targetName.toLowerCase())) {
                    return ws;
                }
            }
        }

        return null;
    }
}
