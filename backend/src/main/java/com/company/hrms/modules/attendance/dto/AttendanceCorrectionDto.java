package com.company.hrms.modules.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class AttendanceCorrectionDto {

    private Long id;

    @NotNull(message = "attendance_record_id không được để trống")
    @JsonProperty("attendance_record_id")
    private Long attendanceRecordId;

    @JsonProperty("employee_id")
    private Long employeeId;

    @JsonProperty("original_check_in")
    private LocalDateTime originalCheckIn;

    @JsonProperty("original_check_out")
    private LocalDateTime originalCheckOut;

    @NotNull(message = "requested_check_in không được để trống")
    @JsonProperty("requested_check_in")
    private LocalDateTime requestedCheckIn;

    @NotNull(message = "requested_check_out không được để trống")
    @JsonProperty("requested_check_out")
    private LocalDateTime requestedCheckOut;

    @NotBlank(message = "Lý do giải trình không được để trống")
    private String reason;

    @JsonProperty("attachment_url")
    private String attachmentUrl;

    private String status;

    @JsonProperty("reviewed_by")
    private Long reviewedBy;

    @JsonProperty("reviewed_at")
    private LocalDateTime reviewedAt;

    @JsonProperty("rejection_reason")
    private String rejectionReason;

    public AttendanceCorrectionDto() {
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
}
