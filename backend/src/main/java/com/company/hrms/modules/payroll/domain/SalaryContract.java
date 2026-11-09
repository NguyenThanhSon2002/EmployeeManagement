package com.company.hrms.modules.payroll.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_contracts")
public class SalaryContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "salary_type", nullable = false, length = 20)
    private String salaryType = "MONTHLY";

    @Column(name = "base_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal baseSalary = BigDecimal.ZERO;

    @Column(name = "hourly_rate", nullable = false, precision = 15, scale = 2)
    private BigDecimal hourlyRate = BigDecimal.ZERO;

    @Column(name = "allowance_lunch", nullable = false, precision = 15, scale = 2)
    private BigDecimal allowanceLunch = BigDecimal.ZERO;

    @Column(name = "allowance_travel", nullable = false, precision = 15, scale = 2)
    private BigDecimal allowanceTravel = BigDecimal.ZERO;

    @Column(name = "insurance_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal insuranceSalary = BigDecimal.ZERO;

    @Column(name = "tax_dependents", nullable = false)
    private Integer taxDependents = 0;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public SalaryContract() {
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getSalaryType() { return salaryType; }
    public void setSalaryType(String salaryType) { this.salaryType = salaryType; }
    public BigDecimal getBaseSalary() { return baseSalary; }
    public void setBaseSalary(BigDecimal baseSalary) { this.baseSalary = baseSalary; }
    public BigDecimal getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(BigDecimal hourlyRate) { this.hourlyRate = hourlyRate; }
    public BigDecimal getAllowanceLunch() { return allowanceLunch; }
    public void setAllowanceLunch(BigDecimal allowanceLunch) { this.allowanceLunch = allowanceLunch; }
    public BigDecimal getAllowanceTravel() { return allowanceTravel; }
    public void setAllowanceTravel(BigDecimal allowanceTravel) { this.allowanceTravel = allowanceTravel; }
    public BigDecimal getInsuranceSalary() { return insuranceSalary; }
    public void setInsuranceSalary(BigDecimal insuranceSalary) { this.insuranceSalary = insuranceSalary; }
    public Integer getTaxDependents() { return taxDependents; }
    public void setTaxDependents(Integer taxDependents) { this.taxDependents = taxDependents; }
    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }
    public LocalDate getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(LocalDate effectiveTo) { this.effectiveTo = effectiveTo; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}
