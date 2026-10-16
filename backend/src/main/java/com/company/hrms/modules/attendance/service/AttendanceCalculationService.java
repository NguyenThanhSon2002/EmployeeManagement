package com.company.hrms.modules.attendance.service;

import com.company.hrms.modules.attendance.domain.AttendanceRecord;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.setting.domain.SystemSetting;
import com.company.hrms.modules.setting.repository.SystemSettingRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class AttendanceCalculationService {

    private final SystemSettingRepository systemSettingRepository;

    public AttendanceCalculationService(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    public void recalculate(AttendanceRecord record, ShiftAssignment assignment) {
        if (record.getCheckInTime() == null) {
            record.setStatus("ABSENT");
            record.setActualHours(BigDecimal.ZERO);
            record.setRegularHours(BigDecimal.ZERO);
            record.setOvertimeHours(BigDecimal.ZERO);
            record.setNightHours(BigDecimal.ZERO);
            record.setLateMinutes(0);
            record.setEarlyLeaveMinutes(0);
            return;
        }

        int gracePeriodMinutes = getGracePeriodMinutes();
        String status = "PRESENT";
        int lateMinutes = 0;
        int earlyLeaveMinutes = 0;

        // 1. Evaluate Check-in punctuality
        if (assignment != null && assignment.getPlannedStartTime() != null) {
            LocalDateTime plannedStart = assignment.getPlannedStartTime();
            if (record.getCheckInTime().isAfter(plannedStart.plusMinutes(gracePeriodMinutes))) {
                lateMinutes = (int) Math.max(0, Duration.between(plannedStart, record.getCheckInTime()).toMinutes());
                status = "LATE";
            }
        }

        // 2. Evaluate Check-out
        if (record.getCheckOutTime() == null) {
            record.setStatus(status.equals("LATE") ? "LATE" : "MISSING_CHECKOUT");
            record.setLateMinutes(lateMinutes);
            record.setEarlyLeaveMinutes(0);
            record.setActualHours(BigDecimal.ZERO);
            record.setRegularHours(BigDecimal.ZERO);
            record.setOvertimeHours(BigDecimal.ZERO);
            record.setNightHours(BigDecimal.ZERO);
            return;
        }

        if (assignment != null && assignment.getPlannedEndTime() != null) {
            LocalDateTime plannedEnd = assignment.getPlannedEndTime();
            if (record.getCheckOutTime().isBefore(plannedEnd)) {
                earlyLeaveMinutes = (int) Math.max(0, Duration.between(record.getCheckOutTime(), plannedEnd).toMinutes());
                if ("PRESENT".equals(status)) {
                    status = "EARLY_LEAVE";
                }
            }
        }

        record.setStatus(status);
        record.setLateMinutes(lateMinutes);
        record.setEarlyLeaveMinutes(earlyLeaveMinutes);

        // 3. Compute duration & hours
        int breakMinutes = assignment != null && assignment.getSnapshotBreakMinutes() != null
                ? assignment.getSnapshotBreakMinutes()
                : 0;

        long grossMinutes = Math.max(0, Duration.between(record.getCheckInTime(), record.getCheckOutTime()).toMinutes());
        long netMinutes = Math.max(0, grossMinutes - breakMinutes);
        double actualHoursVal = netMinutes / 60.0;
        BigDecimal actualHours = BigDecimal.valueOf(actualHoursVal).setScale(2, RoundingMode.HALF_UP);
        record.setActualHours(actualHours);

        // 4. Regular & Overtime Hours
        double plannedHoursVal = 8.0;
        if (assignment != null && assignment.getPlannedStartTime() != null && assignment.getPlannedEndTime() != null) {
            long pMins = Math.max(0, Duration.between(assignment.getPlannedStartTime(), assignment.getPlannedEndTime()).toMinutes() - breakMinutes);
            plannedHoursVal = pMins / 60.0;
        }

        if (actualHoursVal > plannedHoursVal) {
            record.setRegularHours(BigDecimal.valueOf(plannedHoursVal).setScale(2, RoundingMode.HALF_UP));
            record.setOvertimeHours(BigDecimal.valueOf(actualHoursVal - plannedHoursVal).setScale(2, RoundingMode.HALF_UP));
        } else {
            record.setRegularHours(actualHours);
            record.setOvertimeHours(BigDecimal.ZERO);
        }

        // 5. Night Hours (22:00 to 06:00)
        double nightHoursVal = calculateNightHours(record.getCheckInTime(), record.getCheckOutTime());
        record.setNightHours(BigDecimal.valueOf(nightHoursVal).setScale(2, RoundingMode.HALF_UP));
    }

    private double calculateNightHours(LocalDateTime inTime, LocalDateTime outTime) {
        if (inTime.isAfter(outTime)) {
            return 0.0;
        }

        long totalNightMinutes = 0;
        LocalDate cur = inTime.toLocalDate().minusDays(1);
        LocalDate end = outTime.toLocalDate().plusDays(1);

        while (!cur.isAfter(end)) {
            LocalDateTime nightStart = cur.atTime(22, 0);
            LocalDateTime nightEnd = cur.plusDays(1).atTime(6, 0);

            LocalDateTime overlapStart = inTime.isAfter(nightStart) ? inTime : nightStart;
            LocalDateTime overlapEnd = outTime.isBefore(nightEnd) ? outTime : nightEnd;

            if (overlapStart.isBefore(overlapEnd)) {
                totalNightMinutes += Duration.between(overlapStart, overlapEnd).toMinutes();
            }

            cur = cur.plusDays(1);
        }

        return totalNightMinutes / 60.0;
    }

    private int getGracePeriodMinutes() {
        return systemSettingRepository.findBySettingKey("GRACE_PERIOD_MINUTES")
                .map(SystemSetting::getSettingValue)
                .map(v -> {
                    try { return Integer.parseInt(v); } catch (Exception ignored) { return 5; }
                })
                .orElse(5);
    }
}
