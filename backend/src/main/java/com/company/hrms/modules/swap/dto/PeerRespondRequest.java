package com.company.hrms.modules.swap.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PeerRespondRequest {

    @NotBlank(message = "Hành động phản hồi không được để trống")
    @Pattern(regexp = "ACCEPT|REJECT", message = "Hành động chỉ có thể là ACCEPT hoặc REJECT")
    private String action;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String peerNote;

    public PeerRespondRequest() {
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getPeerNote() {
        return peerNote;
    }

    public void setPeerNote(String peerNote) {
        this.peerNote = peerNote;
    }
}
