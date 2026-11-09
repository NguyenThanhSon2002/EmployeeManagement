package com.company.hrms.modules.payroll.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public class PayrollItemDto {

    private Long id;

    @JsonProperty("payroll_id")
    private Long payrollId;

    @JsonProperty("employee_id")
    private Long employeeId;

    @JsonProperty("employee_code")
    private String employeeCode;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("branch_name")
    private String branchName;

    @JsonProperty("position_title")
    private String positionTitle;

    @JsonProperty("employment_type")
    private String employmentType;

    @JsonProperty("salary_type")
    private String salaryType;

    @JsonProperty("standard_hours")
    private BigDecimal standardHours;

    @JsonProperty("actual_hours")
    private BigDecimal actualHours;

    @JsonProperty("night_hours")
    private BigDecimal nightHours;

    @JsonProperty("late_minutes")
    private Integer lateMinutes;

    @JsonProperty("unpaid_leave_days")
    private BigDecimal unpaidLeaveDays;

    @JsonProperty("base_pay")
    private BigDecimal basePay;

    @JsonProperty("night_pay")
    private BigDecimal nightPay;

    @JsonProperty("attendance_bonus")
    private BigDecimal attendanceBonus;

    @JsonProperty("allowances_total")
    private BigDecimal allowancesTotal;

    @JsonProperty("deduction_late")
    private BigDecimal deductionLate;

    @JsonProperty("deduction_unpaid_leave")
    private BigDecimal deductionUnpaidLeave;

    @JsonProperty("insurance_deduction")
    private BigDecimal insuranceDeduction;

    @JsonProperty("tax_deduction")
    private BigDecimal taxDeduction;

    @JsonProperty("gross_salary")
    private BigDecimal grossSalary;

    @JsonProperty("net_salary")
    private BigDecimal netSalary;

    private String status;
    private String note;

    public PayrollItemDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPayrollId() { return payrollId; }
    public void setPayrollId(Long payrollId) { this.payrollId = payrollId; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getPositionTitle() { return positionTitle; }
    public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }
    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
    public String getSalaryType() { return salaryType; }
    public void setSalaryType(String salaryType) { this.salaryType = salaryType; }
    public BigDecimal getStandardHours() { return standardHours; }
    public void setStandardHours(BigDecimal standardHours) { this.standardHours = standardHours; }
    public BigDecimal getActualHours() { return actualHours; }
    public void setActualHours(BigDecimal actualHours) { this.actualHours = actualHours; }
    public BigDecimal getNightHours() { return nightHours; }
    public void setNightHours(BigDecimal nightHours) { this.nightHours = nightHours; }
    public Integer getLateMinutes() { return lateMinutes; }
    public void setLateMinutes(Integer lateMinutes) { this.lateMinutes = lateMinutes; }
    public BigDecimal getUnpaidLeaveDays() { return unpaidLeaveDays; }
    public void setUnpaidLeaveDays(BigDecimal unpaidLeaveDays) { this.unpaidLeaveDays = unpaidLeaveDays; }
    public BigDecimal getBasePay() { return basePay; }
    public void setBasePay(BigDecimal basePay) { this.basePay = basePay; }
    public BigDecimal getNightPay() { return nightPay; }
    public void setNightPay(BigDecimal nightPay) { this.nightPay = nightPay; }
    public BigDecimal getAttendanceBonus() { return attendanceBonus; }
    public void setAttendanceBonus(BigDecimal attendanceBonus) { this.attendanceBonus = attendanceBonus; }
    public BigDecimal getAllowancesTotal() { return allowancesTotal; }
    public void setAllowancesTotal(BigDecimal allowancesTotal) { this.allowancesTotal = allowancesTotal; }
    public BigDecimal getDeductionLate() { return deductionLate; }
    public void setDeductionLate(BigDecimal deductionLate) { this.deductionLate = deductionLate; }
    public BigDecimal getDeductionUnpaidLeave() { return deductionUnpaidLeave; }
    public void setDeductionUnpaidLeave(BigDecimal deductionUnpaidLeave) { this.deductionUnpaidLeave = deductionUnpaidLeave; }
    public BigDecimal getInsuranceDeduction() { return insuranceDeduction; }
    public void setInsuranceDeduction(BigDecimal insuranceDeduction) { this.insuranceDeduction = insuranceDeduction; }
    public BigDecimal getTaxDeduction() { return taxDeduction; }
    public void setTaxDeduction(BigDecimal taxDeduction) { this.taxDeduction = taxDeduction; }
    public BigDecimal getGrossSalary() { return grossSalary; }
    public void setGrossSalary(BigDecimal grossSalary) { this.grossSalary = grossSalary; }
    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
