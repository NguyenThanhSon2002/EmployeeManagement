package com.company.hrms.modules.leave.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateLeaveRequestDto {

    @NotNull(message = "leave_type_id không được để trống")
    @JsonProperty("leave_type_id")
    private Long leaveTypeId;

    @NotNull(message = "start_date không được để trống")
    @JsonProperty("start_date")
    private LocalDate startDate;

    @NotNull(message = "end_date không được để trống")
    @JsonProperty("end_date")
    private LocalDate endDate;

    @NotNull(message = "total_days không được để trống")
    @DecimalMin(value = "0.5", message = "Số ngày nghỉ tối thiểu là 0.5")
    @JsonProperty("total_days")
    private BigDecimal totalDays;

    @NotBlank(message = "Lý do nghỉ phép không được để trống")
    private String reason;

    @JsonProperty("attachment_url")
    private String attachmentUrl;

    public CreateLeaveRequestDto() {
    }

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
}
