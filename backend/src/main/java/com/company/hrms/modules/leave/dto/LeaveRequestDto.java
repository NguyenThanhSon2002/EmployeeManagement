package com.company.hrms.modules.leave.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class LeaveRequestDto {

    private Long id;

    @JsonProperty("employee_id")
    private Long employeeId;

    @JsonProperty("leave_type_id")
    private Long leaveTypeId;

    @JsonProperty("leave_type_name")
    private String leaveTypeName;

    @JsonProperty("start_date")
    private LocalDate startDate;

    @JsonProperty("end_date")
    private LocalDate endDate;

    @JsonProperty("total_days")
    private BigDecimal totalDays;

    private String reason;

    @JsonProperty("attachment_url")
    private String attachmentUrl;

    private String status;

    @JsonProperty("tier1_reviewed_by")
    private Long tier1ReviewedBy;

    @JsonProperty("tier1_reviewed_at")
    private LocalDateTime tier1ReviewedAt;

    @JsonProperty("rejection_reason")
    private String rejectionReason;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    public LeaveRequestDto() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Long getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(Long leaveTypeId) { this.leaveTypeId = leaveTypeId; }
    public String getLeaveTypeName() { return leaveTypeName; }
    public void setLeaveTypeName(String leaveTypeName) { this.leaveTypeName = leaveTypeName; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public BigDecimal getTotalDays() { return totalDays; }
    public void setTotalDays(BigDecimal totalDays) { this.totalDays = totalDays; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getTier1ReviewedBy() { return tier1ReviewedBy; }
    public void setTier1ReviewedBy(Long tier1ReviewedBy) { this.tier1ReviewedBy = tier1ReviewedBy; }
    public LocalDateTime getTier1ReviewedAt() { return tier1ReviewedAt; }
    public void setTier1ReviewedAt(LocalDateTime tier1ReviewedAt) { this.tier1ReviewedAt = tier1ReviewedAt; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
