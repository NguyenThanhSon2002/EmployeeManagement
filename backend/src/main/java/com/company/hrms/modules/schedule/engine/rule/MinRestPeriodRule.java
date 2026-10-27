package com.company.hrms.modules.schedule.engine.rule;

import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.schedule.dto.ConflictValidationResult;
import com.company.hrms.modules.schedule.dto.ScheduleConflictDto;
import com.company.hrms.modules.schedule.engine.ConflictDetectionContext;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;

@Component
public class MinRestPeriodRule implements ConflictRule {

    public static final double DAILY_HOURS_THRESHOLD_FOR_REST = 8.0;

    @Override
    public void evaluate(ConflictDetectionContext context, ConflictValidationResult result) {
        if (context.getPlannedStartTime() == null || context.getPlannedEndTime() == null || context.getWorkDate() == null) {
            return;
        }

        LocalDate candidateWorkDate = context.getWorkDate();
        LocalDate prevDay = candidateWorkDate.minusDays(1);

        ShiftAssignment latestPrevDayShift = null;

        for (ShiftAssignment existing : context.getExistingAssignments()) {
            if ("CANCELLED".equalsIgnoreCase(existing.getStatus())) {
                continue;
            }
            if (context.getExcludeAssignmentId() != null && context.getExcludeAssignmentId().equals(existing.getId())) {
                continue;
            }
            if (!context.getEmployeeId().equals(existing.getEmployeeId())) {
                continue;
            }

            LocalDate existingWorkDate = existing.getWorkDate();
            if (existingWorkDate == null) {
                continue;
            }

            // Quy tắc nghỉ tối thiểu giữa 2 ca chỉ áp dụng khi thêm ca vào ngày N+1 sau khi ngày N làm >= 8h
            // 1. Tìm ca muộn nhất của ngày liền trước (N-1) kết thúc trước khi ca hiện tại (N) bắt đầu
            if (existingWorkDate.equals(prevDay)) {
                if (!existing.getPlannedEndTime().isAfter(context.getPlannedStartTime())) {
                    if (latestPrevDayShift == null || existing.getPlannedEndTime().isAfter(latestPrevDayShift.getPlannedEndTime())) {
                        latestPrevDayShift = existing;
                    }
                }
            }
        }

        double minRestRequired = context.getMinRestHours() > 0 ? context.getMinRestHours() : 12.0;
        String empName = context.getEmployee() != null ? context.getEmployee().getFullName() : "Nhân viên #" + context.getEmployeeId();

        // Kiểm tra khoảng nghỉ với ca muộn nhất của ngày hôm trước (N-1):
        // CHỈ áp dụng nếu tổng thời gian làm việc trong ngày hôm trước (N-1) đạt >= 8.0 giờ
        if (latestPrevDayShift != null) {
            double prevDayTotalHours = calculateDailyNetHours(context, prevDay, false);
            if (prevDayTotalHours >= DAILY_HOURS_THRESHOLD_FOR_REST) {
                double restHours = Duration.between(latestPrevDayShift.getPlannedEndTime(), context.getPlannedStartTime()).toMinutes() / 60.0;
                if (restHours < minRestRequired) {
                    String msg = String.format("Khoảng cách nghỉ ngơi sau ca ngày hôm trước là %.1f giờ (dưới mức tối thiểu %.1f giờ quy định sau khi làm việc %.1f giờ trong ngày %s).",
                            restHours, minRestRequired, prevDayTotalHours, prevDay);

                    result.addWarning(new ScheduleConflictDto(
                            "WARN_INSUFFICIENT_REST_TIME",
                            "WARNING",
                            context.getEmployeeId(),
                            empName,
                            context.getWorkDate(),
                            context.getWorkShiftId(),
                            msg
                    ));
                }
            }
        }
    }

    private double calculateDailyNetHours(ConflictDetectionContext context, LocalDate targetDate, boolean includeCandidate) {
        long totalMinutes = 0;
        if (includeCandidate && targetDate.equals(context.getWorkDate())) {
            int breakMin = context.getWorkShift() != null && context.getWorkShift().getBreakMinutes() != null
                    ? context.getWorkShift().getBreakMinutes()
                    : 0;
            long candidateMinutes = Math.max(0, Duration.between(context.getPlannedStartTime(), context.getPlannedEndTime()).toMinutes() - breakMin);
            totalMinutes += candidateMinutes;
        }

        if (context.getExistingAssignments() != null) {
            for (ShiftAssignment existing : context.getExistingAssignments()) {
                if ("CANCELLED".equalsIgnoreCase(existing.getStatus())) {
                    continue;
                }
                if (context.getExcludeAssignmentId() != null && context.getExcludeAssignmentId().equals(existing.getId())) {
                    continue;
                }
                if (!context.getEmployeeId().equals(existing.getEmployeeId())) {
                    continue;
                }
                if (targetDate.equals(existing.getWorkDate())) {
                    int existBreak = existing.getSnapshotBreakMinutes() != null ? existing.getSnapshotBreakMinutes() : 0;
                    long mins = Math.max(0, Duration.between(existing.getPlannedStartTime(), existing.getPlannedEndTime()).toMinutes() - existBreak);
                    totalMinutes += mins;
                }
            }
        }
        return Math.round((totalMinutes / 60.0) * 10.0) / 10.0;
    }
}
