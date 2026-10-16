package com.company.hrms.modules.leave.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "leave_type_id", nullable = false)
    private Long leaveTypeId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "total_days", nullable = false, precision = 4, scale = 1)
    private BigDecimal totalDays;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "SUBMITTED";

    @Column(name = "tier1_reviewed_by")
    private Long tier1ReviewedBy;

    @Column(name = "tier1_reviewed_at")
    private LocalDateTime tier1ReviewedAt;

    @Column(name = "tier2_reviewed_by")
    private Long tier2ReviewedBy;

    @Column(name = "tier2_reviewed_at")
    private LocalDateTime tier2ReviewedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public LeaveRequest() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Long getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(Long leaveTypeId) { this.leaveTypeId = leaveTypeId; }
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
    public Long getTier2ReviewedBy() { return tier2ReviewedBy; }
    public void setTier2ReviewedBy(Long tier2ReviewedBy) { this.tier2ReviewedBy = tier2ReviewedBy; }
    public LocalDateTime getTier2ReviewedAt() { return tier2ReviewedAt; }
    public void setTier2ReviewedAt(LocalDateTime tier2ReviewedAt) { this.tier2ReviewedAt = tier2ReviewedAt; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
