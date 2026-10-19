package com.company.hrms.modules.branch.domain;

import com.company.hrms.common.entity.BaseAuditableEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "branches")
public class Branch extends BaseAuditableEntity {

    @Column(name = "branch_code", nullable = false, unique = true, length = 50)
    private String branchCode;

    @Column(name = "branch_name", nullable = false, length = 150)
    private String branchName;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "manager_id")
    private Long managerId;

    public Branch() {
    }

    public Branch(String branchCode, String branchName, String address, String phoneNumber, Long managerId) {
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.address = address;
        this.phoneNumber = phoneNumber;
        this.managerId = managerId;
    }

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
}
