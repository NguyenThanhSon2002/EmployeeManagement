package com.company.hrms.modules.branch.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class BranchDto {

    private Long id;

    @NotBlank(message = "Mã chi nhánh không được để trống")
    @JsonProperty("branch_code")
    private String branchCode;

    @NotBlank(message = "Tên chi nhánh không được để trống")
    @JsonProperty("branch_name")
    private String branchName;

    @JsonProperty("address")
    private String address;

    @JsonProperty("phone_number")
    private String phoneNumber;

    @JsonProperty("manager_id")
    private Long managerId;

    @JsonProperty("is_active")
    private Boolean isActive;

    @JsonProperty("version")
    private Integer version;

    public BranchDto() {
    }

    public BranchDto(Long id, String branchCode, String branchName, String address, String phoneNumber, Long managerId, Boolean isActive, Integer version) {
        this.id = id;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.address = address;
        this.phoneNumber = phoneNumber;
        this.managerId = managerId;
        this.isActive = isActive;
        this.version = version;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
}
