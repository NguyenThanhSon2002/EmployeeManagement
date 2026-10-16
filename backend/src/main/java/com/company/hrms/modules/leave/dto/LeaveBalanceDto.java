package com.company.hrms.modules.leave.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public class LeaveBalanceDto {

    private Long id;

    @JsonProperty("employee_id")
    private Long employeeId;

    @JsonProperty("leave_type_id")
    private Long leaveTypeId;

    @JsonProperty("leave_type_name")
    private String leaveTypeName;

    private Integer year;

    @JsonProperty("total_allocated")
    private BigDecimal totalAllocated;

    @JsonProperty("used_days")
    private BigDecimal usedDays;

    @JsonProperty("pending_days")
    private BigDecimal pendingDays;

    @JsonProperty("remaining_days")
    private BigDecimal remainingDays;

    public LeaveBalanceDto() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Long getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(Long leaveTypeId) { this.leaveTypeId = leaveTypeId; }
    public String getLeaveTypeName() { return leaveTypeName; }
    public void setLeaveTypeName(String leaveTypeName) { this.leaveTypeName = leaveTypeName; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public BigDecimal getTotalAllocated() { return totalAllocated; }
    public void setTotalAllocated(BigDecimal totalAllocated) { this.totalAllocated = totalAllocated; }
    public BigDecimal getUsedDays() { return usedDays; }
    public void setUsedDays(BigDecimal usedDays) { this.usedDays = usedDays; }
    public BigDecimal getPendingDays() { return pendingDays; }
    public void setPendingDays(BigDecimal pendingDays) { this.pendingDays = pendingDays; }
    public BigDecimal getRemainingDays() { return remainingDays; }
    public void setRemainingDays(BigDecimal remainingDays) { this.remainingDays = remainingDays; }
}
