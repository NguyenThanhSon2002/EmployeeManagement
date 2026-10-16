package com.company.hrms.modules.department.domain;

import com.company.hrms.common.entity.BaseAuditableEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "departments")
public class Department extends BaseAuditableEntity {

    @Column(name = "department_code", nullable = false, unique = true, length = 50)
    private String departmentCode;

    @Column(name = "department_name", nullable = false, length = 150)
    private String departmentName;

    @Column(name = "parent_department_id")
    private Long parentDepartmentId;

    @Column(name = "manager_id")
    private Long managerId;

    public Department() {
    }

    public Department(String departmentCode, String departmentName, Long parentDepartmentId, Long managerId) {
        this.departmentCode = departmentCode;
        this.departmentName = departmentName;
        this.parentDepartmentId = parentDepartmentId;
        this.managerId = managerId;
    }

    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public Long getParentDepartmentId() { return parentDepartmentId; }
    public void setParentDepartmentId(Long parentDepartmentId) { this.parentDepartmentId = parentDepartmentId; }
    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
}
