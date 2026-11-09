package com.company.hrms.modules.payroll.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SalaryContractDto {

    private Long id;

    @JsonProperty("employee_id")
    private Long employeeId;

    @JsonProperty("employee_code")
    private String employeeCode;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("salary_type")
    private String salaryType;

    @JsonProperty("base_salary")
    private BigDecimal baseSalary;

    @JsonProperty("hourly_rate")
    private BigDecimal hourlyRate;

    @JsonProperty("allowance_lunch")
    private BigDecimal allowanceLunch;

    @JsonProperty("allowance_travel")
    private BigDecimal allowanceTravel;

    @JsonProperty("insurance_salary")
    private BigDecimal insuranceSalary;

    @JsonProperty("tax_dependents")
    private Integer taxDependents;

    @JsonProperty("effective_from")
    private LocalDate effectiveFrom;

    @JsonProperty("effective_to")
    private LocalDate effectiveTo;

    @JsonProperty("is_active")
    private Boolean isActive;

    public SalaryContractDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
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
}
