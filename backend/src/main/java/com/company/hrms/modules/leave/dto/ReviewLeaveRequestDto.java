package com.company.hrms.modules.leave.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class ReviewLeaveRequestDto {

    @NotBlank(message = "Action không được để trống (APPROVE hoặc REJECT)")
    private String action;

    @JsonProperty("rejection_reason")
    private String rejectionReason;

    public ReviewLeaveRequestDto() {
    }

    public ReviewLeaveRequestDto(String action, String rejectionReason) {
        this.action = action;
        this.rejectionReason = rejectionReason;
    }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}
