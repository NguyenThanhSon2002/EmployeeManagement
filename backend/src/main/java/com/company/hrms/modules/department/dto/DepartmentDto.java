package com.company.hrms.modules.department.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class DepartmentDto {

    private Long id;

    @NotBlank(message = "Mã phòng ban không được để trống")
    @JsonProperty("department_code")
    private String departmentCode;

    @NotBlank(message = "Tên phòng ban không được để trống")
    @JsonProperty("department_name")
    private String departmentName;

    @JsonProperty("parent_department_id")
    private Long parentDepartmentId;

    @JsonProperty("manager_id")
    private Long managerId;

    @JsonProperty("is_active")
    private Boolean isActive;

    @JsonProperty("version")
    private Integer version;

    public DepartmentDto() {
    }

    public DepartmentDto(Long id, String departmentCode, String departmentName, Long parentDepartmentId, Long managerId, Boolean isActive, Integer version) {
        this.id = id;
        this.departmentCode = departmentCode;
        this.departmentName = departmentName;
        this.parentDepartmentId = parentDepartmentId;
        this.managerId = managerId;
        this.isActive = isActive;
        this.version = version;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public Long getParentDepartmentId() { return parentDepartmentId; }
    public void setParentDepartmentId(Long parentDepartmentId) { this.parentDepartmentId = parentDepartmentId; }
    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
}
