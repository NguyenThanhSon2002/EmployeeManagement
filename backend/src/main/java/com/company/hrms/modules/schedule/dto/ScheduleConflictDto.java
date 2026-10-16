package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;

public class ScheduleConflictDto {

    @JsonProperty("rule_code")
    private String ruleCode;

    @JsonProperty("severity")
    private String severity; // "MANDATORY" or "WARNING"

    @JsonProperty("employee_id")
    private Long employeeId;

    @JsonProperty("employee_name")
    private String employeeName;

    @JsonProperty("work_date")
    private LocalDate workDate;

    @JsonProperty("work_shift_id")
    private Long workShiftId;

    @JsonProperty("message")
    private String message;

    public ScheduleConflictDto() {
    }

    public ScheduleConflictDto(String ruleCode, String severity, Long employeeId, String employeeName,
                               LocalDate workDate, Long workShiftId, String message) {
        this.ruleCode = ruleCode;
        this.severity = severity;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.workDate = workDate;
        this.workShiftId = workShiftId;
        this.message = message;
    }

    public String getRuleCode() { return ruleCode; }
    public void setRuleCode(String ruleCode) { this.ruleCode = ruleCode; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }
    public Long getWorkShiftId() { return workShiftId; }
    public void setWorkShiftId(Long workShiftId) { this.workShiftId = workShiftId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
