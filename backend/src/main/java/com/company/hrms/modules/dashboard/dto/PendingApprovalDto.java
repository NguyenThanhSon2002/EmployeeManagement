package com.company.hrms.modules.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class PendingApprovalDto {

    private Long id;
    private String type; // 'LEAVE' | 'ATTENDANCE_CORRECTION'

    @JsonProperty("employee_id")
    private Long employeeId;

    @JsonProperty("employee_code")
    private String employeeCode;

    @JsonProperty("employee_name")
    private String employeeName;

    private String title;
    private String reason;

    @JsonProperty("date_str")
    private String dateStr;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    public PendingApprovalDto() {
    }

    public PendingApprovalDto(Long id, String type, Long employeeId, String employeeCode, String employeeName, String title, String reason, String dateStr, LocalDateTime createdAt) {
        this.id = id;
        this.type = type;
        this.employeeId = employeeId;
        this.employeeCode = employeeCode;
        this.employeeName = employeeName;
        this.title = title;
        this.reason = reason;
        this.dateStr = dateStr;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getDateStr() { return dateStr; }
    public void setDateStr(String dateStr) { this.dateStr = dateStr; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
