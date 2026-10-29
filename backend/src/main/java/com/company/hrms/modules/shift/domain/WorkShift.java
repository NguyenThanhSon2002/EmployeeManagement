package com.company.hrms.modules.shift.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "work_shifts")
public class WorkShift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shift_code", nullable = false, length = 50)
    private String shiftCode;

    @Column(name = "shift_name", nullable = false, length = 100)
    private String shiftName;

    @Column(name = "branch_id", nullable = false)
    private Long branchId;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "break_minutes", nullable = false)
    private Integer breakMinutes = 0;

    @Column(name = "is_cross_midnight", nullable = false)
    private Boolean isCrossMidnight = false;

    @Column(name = "color_code", nullable = false, length = 20)
    private String colorCode = "#1677FF";

    @Column(name = "text_color", nullable = false, length = 20)
    private String textColor = "#FFFFFF";

    @Column(name = "min_staffing", nullable = false)
    private Integer minStaffing = 1;

    @Column(name = "max_staffing", nullable = false)
    private Integer maxStaffing = 10;

    @Column(name = "applicable_days", nullable = false, length = 50)
    private String applicableDays = "1,2,3,4,5,6,7";

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public WorkShift() {
    }

    public WorkShift(String shiftCode, String shiftName, LocalTime startTime, LocalTime endTime,
                     Integer breakMinutes, Boolean isCrossMidnight, String colorCode, String textColor,
                     Integer minStaffing, Integer maxStaffing, String applicableDays) {
        this.shiftCode = shiftCode;
        this.shiftName = shiftName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.breakMinutes = breakMinutes != null ? breakMinutes : 0;
        this.isCrossMidnight = isCrossMidnight != null ? isCrossMidnight : false;
        this.colorCode = colorCode != null ? colorCode : "#1677FF";
        this.textColor = textColor != null ? textColor : "#FFFFFF";
        this.minStaffing = minStaffing != null ? minStaffing : 1;
        this.maxStaffing = maxStaffing != null ? maxStaffing : 10;
        this.applicableDays = applicableDays != null ? applicableDays : "1,2,3,4,5,6,7";
        this.isActive = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getShiftCode() { return shiftCode; }
    public void setShiftCode(String shiftCode) { this.shiftCode = shiftCode; }
    public String getShiftName() { return shiftName; }
    public void setShiftName(String shiftName) { this.shiftName = shiftName; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public Integer getBreakMinutes() { return breakMinutes; }
    public void setBreakMinutes(Integer breakMinutes) { this.breakMinutes = breakMinutes; }
    public Boolean getIsCrossMidnight() { return isCrossMidnight; }
    public void setIsCrossMidnight(Boolean crossMidnight) { isCrossMidnight = crossMidnight; }
    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }
    public String getTextColor() { return textColor; }
    public void setTextColor(String textColor) { this.textColor = textColor; }
    public Integer getMinStaffing() { return minStaffing; }
    public void setMinStaffing(Integer minStaffing) { this.minStaffing = minStaffing; }
    public Integer getMaxStaffing() { return maxStaffing; }
    public void setMaxStaffing(Integer maxStaffing) { this.maxStaffing = maxStaffing; }
    public String getApplicableDays() { return applicableDays; }
    public void setApplicableDays(String applicableDays) { this.applicableDays = applicableDays; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    public void softDelete() {
        this.isActive = false;
        this.deletedAt = LocalDateTime.now();
    }
}
