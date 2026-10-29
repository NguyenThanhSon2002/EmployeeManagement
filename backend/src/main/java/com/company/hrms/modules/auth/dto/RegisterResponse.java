package com.company.hrms.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public class RegisterResponse {

    @JsonProperty("employee_code")
    @JsonAlias({"employeeCode", "employee_code"})
    private String employeeCode;

    @JsonProperty("full_name")
    @JsonAlias({"fullName", "full_name"})
    private String fullName;

    @JsonProperty("email")
    private String email;

    @JsonProperty("branch_id")
    @JsonAlias({"branchId", "branch_id"})
    private Long branchId;

    @JsonProperty("branch_name")
    @JsonAlias({"branchName", "branch_name"})
    private String branchName;

    @JsonProperty("default_password")
    @JsonAlias({"defaultPassword", "default_password"})
    private String defaultPassword;

    @JsonProperty("message")
    private String message;

    public RegisterResponse() {
    }

    public RegisterResponse(String employeeCode, String fullName, String email, Long branchId, String branchName, String defaultPassword, String message) {
        this.employeeCode = employeeCode;
        this.fullName = fullName;
        this.email = email;
        this.branchId = branchId;
        this.branchName = branchName;
        this.defaultPassword = defaultPassword;
        this.message = message;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getDefaultPassword() {
        return defaultPassword;
    }

    public void setDefaultPassword(String defaultPassword) {
        this.defaultPassword = defaultPassword;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
