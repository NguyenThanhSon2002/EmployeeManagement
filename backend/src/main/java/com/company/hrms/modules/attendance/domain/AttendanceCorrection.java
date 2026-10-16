package com.company.hrms.modules.attendance.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_corrections")
public class AttendanceCorrection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attendance_record_id", nullable = false)
    private Long attendanceRecordId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "original_check_in")
    private LocalDateTime originalCheckIn;

    @Column(name = "original_check_out")
    private LocalDateTime originalCheckOut;

    @Column(name = "requested_check_in", nullable = false)
    private LocalDateTime requestedCheckIn;

    @Column(name = "requested_check_out", nullable = false)
    private LocalDateTime requestedCheckOut;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AttendanceCorrection() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAttendanceRecordId() { return attendanceRecordId; }
    public void setAttendanceRecordId(Long attendanceRecordId) { this.attendanceRecordId = attendanceRecordId; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public LocalDateTime getOriginalCheckIn() { return originalCheckIn; }
    public void setOriginalCheckIn(LocalDateTime originalCheckIn) { this.originalCheckIn = originalCheckIn; }
    public LocalDateTime getOriginalCheckOut() { return originalCheckOut; }
    public void setOriginalCheckOut(LocalDateTime originalCheckOut) { this.originalCheckOut = originalCheckOut; }
    public LocalDateTime getRequestedCheckIn() { return requestedCheckIn; }
    public void setRequestedCheckIn(LocalDateTime requestedCheckIn) { this.requestedCheckIn = requestedCheckIn; }
    public LocalDateTime getRequestedCheckOut() { return requestedCheckOut; }
    public void setRequestedCheckOut(LocalDateTime requestedCheckOut) { this.requestedCheckOut = requestedCheckOut; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(Long reviewedBy) { this.reviewedBy = reviewedBy; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
