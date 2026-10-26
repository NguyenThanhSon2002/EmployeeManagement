package com.company.hrms.modules.employee.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SecondaryBranchAssignmentDto {

    @JsonProperty("branch_id")
    private Long branchId;

    @JsonProperty("position_id")
    private Long positionId;

    @JsonProperty("branch_name")
    private String branchName;

    @JsonProperty("position_name")
    private String positionName;

    public SecondaryBranchAssignmentDto() {
    }

    public SecondaryBranchAssignmentDto(Long branchId, Long positionId) {
        this.branchId = branchId;
        this.positionId = positionId;
    }

    public SecondaryBranchAssignmentDto(Long branchId, Long positionId, String branchName, String positionName) {
        this.branchId = branchId;
        this.positionId = positionId;
        this.branchName = branchName;
        this.positionName = positionName;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public Long getPositionId() {
        return positionId;
    }

    public void setPositionId(Long positionId) {
        this.positionId = positionId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getPositionName() {
        return positionName;
    }

    public void setPositionName(String positionName) {
        this.positionName = positionName;
    }
}
