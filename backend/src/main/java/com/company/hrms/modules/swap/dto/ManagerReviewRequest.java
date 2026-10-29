package com.company.hrms.modules.swap.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ManagerReviewRequest {

    @NotBlank(message = "Hành động duyệt không được để trống")
    @Pattern(regexp = "APPROVE|REJECT", message = "Hành động chỉ có thể là APPROVE hoặc REJECT")
    private String action;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String managerNote;

    public ManagerReviewRequest() {
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getManagerNote() {
        return managerNote;
    }

    public void setManagerNote(String managerNote) {
        this.managerNote = managerNote;
    }
}
