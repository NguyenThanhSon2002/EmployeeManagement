package com.company.hrms.modules.swap.dto;

import com.company.hrms.modules.swap.domain.SwapType;
import jakarta.validation.constraints.NotNull;

public class SimulateSwapRequest {

    @NotNull(message = "ID phân ca của người yêu cầu không được để trống")
    private Long requesterAssignmentId;

    @NotNull(message = "ID nhân viên đối tác không được để trống")
    private Long targetEmployeeId;

    private Long targetAssignmentId;

    private SwapType type = SwapType.HANDOVER;

    public SimulateSwapRequest() {
    }

    public Long getRequesterAssignmentId() {
        return requesterAssignmentId;
    }

    public void setRequesterAssignmentId(Long requesterAssignmentId) {
        this.requesterAssignmentId = requesterAssignmentId;
    }

    public Long getTargetEmployeeId() {
        return targetEmployeeId;
    }

    public void setTargetEmployeeId(Long targetEmployeeId) {
        this.targetEmployeeId = targetEmployeeId;
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
}
