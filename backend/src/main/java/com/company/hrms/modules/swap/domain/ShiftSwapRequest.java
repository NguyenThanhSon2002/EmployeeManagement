package com.company.hrms.modules.swap.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shift_swap_requests")
public class ShiftSwapRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_code", nullable = false, unique = true, length = 50)
    private String requestCode;

    @Column(name = "branch_id", nullable = false)
    private Long branchId;

    @Column(name = "requester_id", nullable = false)
    private Long requesterId;

    @Column(name = "requester_assignment_id", nullable = false)
    private Long requesterAssignmentId;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "target_assignment_id")
    private Long targetAssignmentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private SwapType type;

    @Column(name = "reason", nullable = false, length = 255)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SwapStatus status = SwapStatus.PENDING_PEER;

    @Column(name = "peer_note", length = 255)
    private String peerNote;

    @Column(name = "peer_responded_at")
    private LocalDateTime peerRespondedAt;

    @Column(name = "manager_id")
    private Long managerId;

    @Column(name = "manager_note", length = 255)
    private String managerNote;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    public ShiftSwapRequest() {
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRequestCode() {
        return requestCode;
    }

    public void setRequestCode(String requestCode) {
        this.requestCode = requestCode;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(Long requesterId) {
        this.requesterId = requesterId;
    }

    public Long getRequesterAssignmentId() {
        return requesterAssignmentId;
    }

    public void setRequesterAssignmentId(Long requesterAssignmentId) {
        this.requesterAssignmentId = requesterAssignmentId;
    }

    public Long getTargetId() {
        return targetId;
    }

    public void setTargetId(Long targetId) {
        this.targetId = targetId;
    }

    public Long getTargetAssignmentId() {
        return targetAssignmentId;
    }

    public void setTargetAssignmentId(Long targetAssignmentId) {
        this.targetAssignmentId = targetAssignmentId;
    }

    public SwapType getType() {
        return type;
    }

    public void setType(SwapType type) {
        this.type = type;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public SwapStatus getStatus() {
        return status;
    }

    public void setStatus(SwapStatus status) {
        this.status = status;
    }

    public String getPeerNote() {
        return peerNote;
    }

    public void setPeerNote(String peerNote) {
        this.peerNote = peerNote;
    }

    public LocalDateTime getPeerRespondedAt() {
        return peerRespondedAt;
    }

    public void setPeerRespondedAt(LocalDateTime peerRespondedAt) {
        this.peerRespondedAt = peerRespondedAt;
    }

    public Long getManagerId() {
        return managerId;
    }

    public void setManagerId(Long managerId) {
        this.managerId = managerId;
    }

    public String getManagerNote() {
        return managerNote;
    }

    public void setManagerNote(String managerNote) {
        this.managerNote = managerNote;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
