package com.company.hrms.modules.payroll.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateSalaryContractRequest {

    @NotNull(message = "employee_id không được để trống")
    @JsonProperty("employee_id")
    private Long employeeId;

    @NotNull(message = "salary_type không được để trống")
    @JsonProperty("salary_type")
    private String salaryType = "MONTHLY";

    @JsonProperty("base_salary")
    private BigDecimal baseSalary = BigDecimal.ZERO;

    @JsonProperty("hourly_rate")
    private BigDecimal hourlyRate = BigDecimal.ZERO;

    @JsonProperty("allowance_lunch")
    private BigDecimal allowanceLunch = BigDecimal.ZERO;

    @JsonProperty("allowance_travel")
    private BigDecimal allowanceTravel = BigDecimal.ZERO;

    @JsonProperty("insurance_salary")
    private BigDecimal insuranceSalary = BigDecimal.ZERO;

    @JsonProperty("tax_dependents")
    private Integer taxDependents = 0;

    @NotNull(message = "effective_from không được để trống")
    @JsonProperty("effective_from")
    private LocalDate effectiveFrom;

    @JsonProperty("effective_to")
    private LocalDate effectiveTo;

    public CreateSalaryContractRequest() {}

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
}
