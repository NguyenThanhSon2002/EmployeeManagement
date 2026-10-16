package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class AssignSingleShiftRequest {

    @NotNull(message = "schedule_id không được để trống")
    @JsonProperty("schedule_id")
    private Long scheduleId;

    @NotNull(message = "employee_id không được để trống")
    @JsonProperty("employee_id")
    private Long employeeId;

    @NotNull(message = "work_shift_id không được để trống")
    @JsonProperty("work_shift_id")
    private Long workShiftId;

    @NotNull(message = "work_date không được để trống")
    @JsonProperty("work_date")
    private LocalDate workDate;

    @JsonProperty("override_rule")
    private String overrideRule;

    @JsonProperty("override_reason")
    private String overrideReason;

    @NotNull(message = "schedule_version không được để trống")
    @JsonProperty("schedule_version")
    private Integer scheduleVersion;

    public AssignSingleShiftRequest() {
    }

    public AssignSingleShiftRequest(Long scheduleId, Long employeeId, Long workShiftId,
                                    LocalDate workDate, Integer scheduleVersion) {
        this.scheduleId = scheduleId;
        this.employeeId = employeeId;
        this.workShiftId = workShiftId;
        this.workDate = workDate;
        this.scheduleVersion = scheduleVersion;
    }

    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Long getWorkShiftId() { return workShiftId; }
    public void setWorkShiftId(Long workShiftId) { this.workShiftId = workShiftId; }
    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }
    public String getOverrideRule() { return overrideRule; }
    public void setOverrideRule(String overrideRule) { this.overrideRule = overrideRule; }
    public String getOverrideReason() { return overrideReason; }
    public void setOverrideReason(String overrideReason) { this.overrideReason = overrideReason; }
    public Integer getScheduleVersion() { return scheduleVersion; }
    public void setScheduleVersion(Integer scheduleVersion) { this.scheduleVersion = scheduleVersion; }
}
