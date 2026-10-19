package com.company.hrms.modules.report.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public class AttendanceSummaryDto {

    @JsonProperty("employee_id")
    private Long employeeId;

    @JsonProperty("employee_code")
    private String employeeCode;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("branch_name")
    private String branchName;

    @JsonProperty("total_working_days")
    private Long totalWorkingDays = 0L;

    @JsonProperty("total_actual_hours")
    private BigDecimal totalActualHours = BigDecimal.ZERO;

    @JsonProperty("total_regular_hours")
    private BigDecimal totalRegularHours = BigDecimal.ZERO;

    @JsonProperty("total_overtime_hours")
    private BigDecimal totalOvertimeHours = BigDecimal.ZERO;

    @JsonProperty("total_night_hours")
    private BigDecimal totalNightHours = BigDecimal.ZERO;

    @JsonProperty("late_count")
    private Long lateCount = 0L;

    @JsonProperty("early_leave_count")
    private Long earlyLeaveCount = 0L;

    public AttendanceSummaryDto() {
    }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public Long getTotalWorkingDays() { return totalWorkingDays; }
    public void setTotalWorkingDays(Long totalWorkingDays) { this.totalWorkingDays = totalWorkingDays; }
    public BigDecimal getTotalActualHours() { return totalActualHours; }
    public void setTotalActualHours(BigDecimal totalActualHours) { this.totalActualHours = totalActualHours; }
    public BigDecimal getTotalRegularHours() { return totalRegularHours; }
    public void setTotalRegularHours(BigDecimal totalRegularHours) { this.totalRegularHours = totalRegularHours; }
    public BigDecimal getTotalOvertimeHours() { return totalOvertimeHours; }
    public void setTotalOvertimeHours(BigDecimal totalOvertimeHours) { this.totalOvertimeHours = totalOvertimeHours; }
    public BigDecimal getTotalNightHours() { return totalNightHours; }
    public void setNightHours(BigDecimal totalNightHours) { this.totalNightHours = totalNightHours; }
    public Long getLateCount() { return lateCount; }
    public void setLateCount(Long lateCount) { this.lateCount = lateCount; }
    public Long getEarlyLeaveCount() { return earlyLeaveCount; }
    public void setEarlyLeaveCount(Long earlyLeaveCount) { this.earlyLeaveCount = earlyLeaveCount; }
}
