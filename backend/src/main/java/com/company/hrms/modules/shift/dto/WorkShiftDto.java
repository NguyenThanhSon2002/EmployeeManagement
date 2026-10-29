package com.company.hrms.modules.shift.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public class WorkShiftDto {

    private Long id;

    @NotBlank(message = "Mã ca làm việc không được để trống")
    @JsonProperty("shift_code")
    private String shiftCode;

    @NotBlank(message = "Tên ca làm việc không được để trống")
    @JsonProperty("shift_name")
    private String shiftName;

    @NotNull(message = "Chi nhánh áp dụng không được để trống")
    @JsonProperty("branch_id")
    private Long branchId;

    @JsonProperty("branch_name")
    private String branchName;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    @JsonProperty("start_time")
    private LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    @JsonProperty("end_time")
    private LocalTime endTime;

    @JsonProperty("break_minutes")
    private Integer breakMinutes = 0;

    @JsonProperty("is_cross_midnight")
    private Boolean isCrossMidnight = false;

    @JsonProperty("color_code")
    private String colorCode = "#1677FF";

    @JsonProperty("text_color")
    private String textColor = "#FFFFFF";

    @JsonProperty("min_staffing")
    private Integer minStaffing = 1;

    @JsonProperty("max_staffing")
    private Integer maxStaffing = 10;

    @JsonProperty("applicable_days")
    private String applicableDays = "1,2,3,4,5,6,7";

    @JsonProperty("is_active")
    private Boolean isActive = true;

    public WorkShiftDto() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getShiftCode() { return shiftCode; }
    public void setShiftCode(String shiftCode) { this.shiftCode = shiftCode; }
    public String getShiftName() { return shiftName; }
    public void setShiftName(String shiftName) { this.shiftName = shiftName; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
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
}
