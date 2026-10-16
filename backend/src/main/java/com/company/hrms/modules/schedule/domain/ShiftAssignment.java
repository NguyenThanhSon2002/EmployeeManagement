package com.company.hrms.modules.schedule.domain;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "shift_assignments")
public class ShiftAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "schedule_id", nullable = false)
    private Long scheduleId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "work_shift_id", nullable = false)
    private Long workShiftId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "snapshot_shift_name", nullable = false, length = 100)
    private String snapshotShiftName;

    @Column(name = "snapshot_start_time", nullable = false)
    private LocalTime snapshotStartTime;

    @Column(name = "snapshot_end_time", nullable = false)
    private LocalTime snapshotEndTime;

    @Column(name = "snapshot_break_minutes", nullable = false)
    private Integer snapshotBreakMinutes = 0;

    @Column(name = "snapshot_cross_midnight", nullable = false)
    private Boolean snapshotCrossMidnight = false;

    @Column(name = "snapshot_color_code", nullable = false, length = 20)
    private String snapshotColorCode = "#1677FF";

    @Column(name = "planned_start_time", nullable = false)
    private LocalDateTime plannedStartTime;

    @Column(name = "planned_end_time", nullable = false)
    private LocalDateTime plannedEndTime;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "ASSIGNED";

    @Column(name = "override_rule", length = 50)
    private String overrideRule;

    @Column(name = "override_reason", columnDefinition = "TEXT")
    private String overrideReason;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public ShiftAssignment() {
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Long getWorkShiftId() { return workShiftId; }
    public void setWorkShiftId(Long workShiftId) { this.workShiftId = workShiftId; }
    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }
    public String getSnapshotShiftName() { return snapshotShiftName; }
    public void setSnapshotShiftName(String snapshotShiftName) { this.snapshotShiftName = snapshotShiftName; }
    public LocalTime getSnapshotStartTime() { return snapshotStartTime; }
    public void setSnapshotStartTime(LocalTime snapshotStartTime) { this.snapshotStartTime = snapshotStartTime; }
    public LocalTime getSnapshotEndTime() { return snapshotEndTime; }
    public void setSnapshotEndTime(LocalTime snapshotEndTime) { this.snapshotEndTime = snapshotEndTime; }
    public Integer getSnapshotBreakMinutes() { return snapshotBreakMinutes; }
    public void setSnapshotBreakMinutes(Integer snapshotBreakMinutes) { this.snapshotBreakMinutes = snapshotBreakMinutes; }
    public Boolean getSnapshotCrossMidnight() { return snapshotCrossMidnight; }
    public void setSnapshotCrossMidnight(Boolean snapshotCrossMidnight) { this.snapshotCrossMidnight = snapshotCrossMidnight; }
    public String getSnapshotColorCode() { return snapshotColorCode; }
    public void setSnapshotColorCode(String snapshotColorCode) { this.snapshotColorCode = snapshotColorCode; }
    public LocalDateTime getPlannedStartTime() { return plannedStartTime; }
    public void setPlannedStartTime(LocalDateTime plannedStartTime) { this.plannedStartTime = plannedStartTime; }
    public LocalDateTime getPlannedEndTime() { return plannedEndTime; }
    public void setPlannedEndTime(LocalDateTime plannedEndTime) { this.plannedEndTime = plannedEndTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getOverrideRule() { return overrideRule; }
    public void setOverrideRule(String overrideRule) { this.overrideRule = overrideRule; }
    public String getOverrideReason() { return overrideReason; }
    public void setOverrideReason(String overrideReason) { this.overrideReason = overrideReason; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
