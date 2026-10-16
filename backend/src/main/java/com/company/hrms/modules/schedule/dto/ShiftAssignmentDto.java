package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.time.LocalTime;

public class ShiftAssignmentDto {

    private Long id;

    @JsonProperty("schedule_id")
    private Long scheduleId;

    @JsonProperty("employee_id")
    private Long employeeId;

    @JsonProperty("work_shift_id")
    private Long workShiftId;

    @JsonProperty("work_date")
    private LocalDate workDate;

    @JsonProperty("shift_name")
    private String shiftName;

    @JsonProperty("start_time")
    private LocalTime startTime;

    @JsonProperty("end_time")
    private LocalTime endTime;

    @JsonProperty("break_minutes")
    private Integer breakMinutes;

    @JsonProperty("is_cross_midnight")
    private Boolean isCrossMidnight;

    @JsonProperty("color_code")
    private String colorCode;

    private String status;

    @JsonProperty("override_rule")
    private String overrideRule;

    @JsonProperty("override_reason")
    private String overrideReason;

    private Integer version;

    public ShiftAssignmentDto() {
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
    public String getShiftName() { return shiftName; }
    public void setShiftName(String shiftName) { this.shiftName = shiftName; }
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
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getOverrideRule() { return overrideRule; }
    public void setOverrideRule(String overrideRule) { this.overrideRule = overrideRule; }
    public String getOverrideReason() { return overrideReason; }
    public void setOverrideReason(String overrideReason) { this.overrideReason = overrideReason; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
}
