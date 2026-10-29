package com.company.hrms.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RegisterRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @JsonProperty("full_name")
    @JsonAlias({"fullName", "full_name"})
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Địa chỉ email không hợp lệ")
    @JsonProperty("email")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @JsonProperty("phone_number")
    @JsonAlias({"phoneNumber", "phone_number"})
    private String phoneNumber;

    @NotNull(message = "Vui lòng chọn chi nhánh làm việc")
    @JsonProperty("branch_id")
    @JsonAlias({"branchId", "branch_id"})
    private Long branchId;

    @JsonProperty("notes")
    private String notes;

    public RegisterRequest() {
    }

    public RegisterRequest(String fullName, String email, String phoneNumber, Long branchId, String notes) {
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.branchId = branchId;
        this.notes = notes;
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
