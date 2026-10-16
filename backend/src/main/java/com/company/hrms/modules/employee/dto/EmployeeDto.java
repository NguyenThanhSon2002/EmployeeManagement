package com.company.hrms.modules.employee.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class EmployeeDto {

    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    @NotBlank(message = "Mã nhân viên không được để trống")
    @JsonProperty("employee_code")
    private String employeeCode;

    @NotBlank(message = "Họ và tên không được để trống")
    @JsonProperty("full_name")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @JsonProperty("phone_number")
    private String phoneNumber;

    @JsonProperty("national_id")
    private String nationalId;

    @JsonProperty("date_of_birth")
    private LocalDate dateOfBirth;

    private String gender;
    private String address;

    @NotNull(message = "Phòng ban không được để trống")
    @JsonProperty("department_id")
    private Long departmentId;

    @NotNull(message = "Chức danh không được để trống")
    @JsonProperty("position_id")
    private Long positionId;

    @JsonProperty("manager_id")
    private Long managerId;

    @JsonProperty("employment_status")
    private String employmentStatus;

    @JsonProperty("employment_type")
    private String employmentType;

    @NotNull(message = "Ngày vào làm không được để trống")
    @JsonProperty("hire_date")
    private LocalDate hireDate;

    @JsonProperty("resignation_date")
    private LocalDate resignationDate;

    @JsonProperty("is_active")
    private Boolean isActive;

    @JsonProperty("version")
    private Integer version;

    public EmployeeDto() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getNationalId() { return nationalId; }
    public void setNationalId(String nationalId) { this.nationalId = nationalId; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Long getPositionId() { return positionId; }
    public void setPositionId(Long positionId) { this.positionId = positionId; }
    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
    public String getEmploymentStatus() { return employmentStatus; }
    public void setEmploymentStatus(String employmentStatus) { this.employmentStatus = employmentStatus; }
    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }
    public LocalDate getResignationDate() { return resignationDate; }
    public void setResignationDate(LocalDate resignationDate) { this.resignationDate = resignationDate; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }
}
