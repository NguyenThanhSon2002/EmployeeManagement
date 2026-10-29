package com.company.hrms.modules.swap.dto;

import com.company.hrms.modules.swap.domain.SwapStatus;
import com.company.hrms.modules.swap.domain.SwapType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class ShiftSwapResponse {

    private Long id;
    private String requestCode;
    private Long branchId;
    private String branchName;

    // Requester (A)
    private Long requesterId;
    private String requesterCode;
    private String requesterName;
    private Long requesterAssignmentId;
    private String requesterShiftName;
    private LocalDate requesterWorkDate;
    private LocalTime requesterStartTime;
    private LocalTime requesterEndTime;

    // Target (B)
    private Long targetId;
    private String targetCode;
    private String targetName;
    private Long targetAssignmentId;
    private String targetShiftName;
    private LocalDate targetWorkDate;
    private LocalTime targetStartTime;
    private LocalTime targetEndTime;

    private SwapType type;
    private String reason;
    private SwapStatus status;
    private String peerNote;
    private LocalDateTime peerRespondedAt;
    private Long managerId;
    private String managerName;
    private String managerNote;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;

    public ShiftSwapResponse() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRequestCode() { return requestCode; }
    public void setRequestCode(String requestCode) { this.requestCode = requestCode; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public Long getRequesterId() { return requesterId; }
    public void setRequesterId(Long requesterId) { this.requesterId = requesterId; }
    public String getRequesterCode() { return requesterCode; }
    public void setRequesterCode(String requesterCode) { this.requesterCode = requesterCode; }
    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
    public Long getRequesterAssignmentId() { return requesterAssignmentId; }
    public void setRequesterAssignmentId(Long requesterAssignmentId) { this.requesterAssignmentId = requesterAssignmentId; }
    public String getRequesterShiftName() { return requesterShiftName; }
    public void setRequesterShiftName(String requesterShiftName) { this.requesterShiftName = requesterShiftName; }
    public LocalDate getRequesterWorkDate() { return requesterWorkDate; }
    public void setRequesterWorkDate(LocalDate requesterWorkDate) { this.requesterWorkDate = requesterWorkDate; }
    public LocalTime getRequesterStartTime() { return requesterStartTime; }
    public void setRequesterStartTime(LocalTime requesterStartTime) { this.requesterStartTime = requesterStartTime; }
    public LocalTime getRequesterEndTime() { return requesterEndTime; }
    public void setRequesterEndTime(LocalTime requesterEndTime) { this.requesterEndTime = requesterEndTime; }

    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    public String getTargetCode() { return targetCode; }
    public void setTargetCode(String targetCode) { this.targetCode = targetCode; }
    public String getTargetName() { return targetName; }
    public void setTargetName(String targetName) { this.targetName = targetName; }
    public Long getTargetAssignmentId() { return targetAssignmentId; }
    public void setTargetAssignmentId(Long targetAssignmentId) { this.targetAssignmentId = targetAssignmentId; }
    public String getTargetShiftName() { return targetShiftName; }
    public void setTargetShiftName(String targetShiftName) { this.targetShiftName = targetShiftName; }
    public LocalDate getTargetWorkDate() { return targetWorkDate; }
    public void setTargetWorkDate(LocalDate targetWorkDate) { this.targetWorkDate = targetWorkDate; }
    public LocalTime getTargetStartTime() { return targetStartTime; }
    public void setTargetStartTime(LocalTime targetStartTime) { this.targetStartTime = targetStartTime; }
    public LocalTime getTargetEndTime() { return targetEndTime; }
    public void setTargetEndTime(LocalTime targetEndTime) { this.targetEndTime = targetEndTime; }

    public SwapType getType() { return type; }
    public void setType(SwapType type) { this.type = type; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public SwapStatus getStatus() { return status; }
    public void setStatus(SwapStatus status) { this.status = status; }
    public String getPeerNote() { return peerNote; }
    public void setPeerNote(String peerNote) { this.peerNote = peerNote; }
    public LocalDateTime getPeerRespondedAt() { return peerRespondedAt; }
    public void setPeerRespondedAt(LocalDateTime peerRespondedAt) { this.peerRespondedAt = peerRespondedAt; }
    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }
    public String getManagerNote() { return managerNote; }
    public void setManagerNote(String managerNote) { this.managerNote = managerNote; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
