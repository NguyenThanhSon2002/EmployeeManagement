package com.company.hrms.modules.schedule.service;

import com.company.hrms.common.exception.BusinessException;
import com.company.hrms.modules.schedule.domain.Schedule;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.CopyWeekRequest;
import com.company.hrms.modules.schedule.dto.CopyWeekResponse;
import com.company.hrms.modules.schedule.repository.ScheduleRepository;
import com.company.hrms.modules.schedule.repository.ShiftAssignmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Service chuyên biệt chịu trách nhiệm sao chép lịch làm việc giữa các tuần.
 * Tách biệt khỏi ScheduleService nhằm tuân thủ Single Responsibility Principle (SRP).
 */
@Service
public class ScheduleCopyWeekService {

    private final ScheduleRepository scheduleRepository;
    private final ShiftAssignmentRepository assignmentRepository;

    public ScheduleCopyWeekService(
            ScheduleRepository scheduleRepository,
            ShiftAssignmentRepository assignmentRepository) {
        this.scheduleRepository = scheduleRepository;
        this.assignmentRepository = assignmentRepository;
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
            throw new BusinessException(
                    "SCHEDULE_ALREADY_PUBLISHED",
                    "Lịch tuần đích đã được công bố chính thức, không thể sao chép đè.",
                    HttpStatus.BAD_REQUEST
            );
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
        long daysDiff = ChronoUnit.DAYS.between(sourceStart, targetStart);

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
}
