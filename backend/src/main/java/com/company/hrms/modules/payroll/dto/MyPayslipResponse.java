package com.company.hrms.modules.payroll.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MyPayslipResponse {

    @JsonProperty("item_id")
    private Long itemId;

    @JsonProperty("payroll_id")
    private Long payrollId;

    @JsonProperty("period_month")
    private Integer periodMonth;

    @JsonProperty("period_year")
    private Integer periodYear;

    @JsonProperty("payroll_status")
    private String payrollStatus;

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

    @JsonProperty("employment_status")
    private String employmentStatus;

    @JsonProperty("salary_type")
    private String salaryType;

    @JsonProperty("standard_hours")
    private BigDecimal standardHours;

    @JsonProperty("actual_hours")
    private BigDecimal actualHours;

    @JsonProperty("part_time_hours")
    private BigDecimal partTimeHours;

    @JsonProperty("night_hours")
    private BigDecimal nightHours;

    @JsonProperty("late_minutes")
    private Integer lateMinutes;

    @JsonProperty("unpaid_leave_days")
    private BigDecimal unpaidLeaveDays;

    // 1. Thu nhập (Earnings)
    @JsonProperty("base_pay")
    private BigDecimal basePay;

    @JsonProperty("part_time_pay")
    private BigDecimal partTimePay;

    @JsonProperty("night_pay")
    private BigDecimal nightPay;

    @JsonProperty("attendance_bonus")
    private BigDecimal attendanceBonus;

    @JsonProperty("allowances_total")
    private BigDecimal allowancesTotal;

    @JsonProperty("gross_salary")
    private BigDecimal grossSalary;

    // 2. Giảm trừ (Deductions)
    @JsonProperty("deduction_late")
    private BigDecimal deductionLate;

    @JsonProperty("deduction_unpaid_leave")
    private BigDecimal deductionUnpaidLeave;

    @JsonProperty("insurance_deduction")
    private BigDecimal insuranceDeduction;

    @JsonProperty("tax_deduction")
    private BigDecimal taxDeduction;

    @JsonProperty("total_deductions")
    private BigDecimal totalDeductions;

    // 3. Thực lĩnh (Net)
    @JsonProperty("net_salary")
    private BigDecimal netSalary;

    private String note;

    @JsonProperty("adjustments_detail")
    private String adjustmentsDetail;

    @JsonProperty("approved_at")
    private LocalDateTime approvedAt;

    public MyPayslipResponse() {}

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public Long getPayrollId() { return payrollId; }
    public void setPayrollId(Long payrollId) { this.payrollId = payrollId; }
    public Integer getPeriodMonth() { return periodMonth; }
    public void setPeriodMonth(Integer periodMonth) { this.periodMonth = periodMonth; }
    public Integer getPeriodYear() { return periodYear; }
    public void setPeriodYear(Integer periodYear) { this.periodYear = periodYear; }
    public String getPayrollStatus() { return payrollStatus; }
    public void setPayrollStatus(String payrollStatus) { this.payrollStatus = payrollStatus; }
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
    public String getEmploymentStatus() { return employmentStatus; }
    public void setEmploymentStatus(String employmentStatus) { this.employmentStatus = employmentStatus; }
    public String getSalaryType() { return salaryType; }
    public void setSalaryType(String salaryType) { this.salaryType = salaryType; }
    public BigDecimal getStandardHours() { return standardHours; }
    public void setStandardHours(BigDecimal standardHours) { this.standardHours = standardHours; }
    public BigDecimal getActualHours() { return actualHours; }
    public void setActualHours(BigDecimal actualHours) { this.actualHours = actualHours; }
    public BigDecimal getPartTimeHours() { return partTimeHours; }
    public void setPartTimeHours(BigDecimal partTimeHours) { this.partTimeHours = partTimeHours; }
    public BigDecimal getNightHours() { return nightHours; }
    public void setNightHours(BigDecimal nightHours) { this.nightHours = nightHours; }
    public Integer getLateMinutes() { return lateMinutes; }
    public void setLateMinutes(Integer lateMinutes) { this.lateMinutes = lateMinutes; }
    public BigDecimal getUnpaidLeaveDays() { return unpaidLeaveDays; }
    public void setUnpaidLeaveDays(BigDecimal unpaidLeaveDays) { this.unpaidLeaveDays = unpaidLeaveDays; }
    public BigDecimal getBasePay() { return basePay; }
    public void setBasePay(BigDecimal basePay) { this.basePay = basePay; }
    public BigDecimal getPartTimePay() { return partTimePay; }
    public void setPartTimePay(BigDecimal partTimePay) { this.partTimePay = partTimePay; }
    public BigDecimal getNightPay() { return nightPay; }
    public void setNightPay(BigDecimal nightPay) { this.nightPay = nightPay; }
    public BigDecimal getAttendanceBonus() { return attendanceBonus; }
    public void setAttendanceBonus(BigDecimal attendanceBonus) { this.attendanceBonus = attendanceBonus; }
    public BigDecimal getAllowancesTotal() { return allowancesTotal; }
    public void setAllowancesTotal(BigDecimal allowancesTotal) { this.allowancesTotal = allowancesTotal; }
    public BigDecimal getGrossSalary() { return grossSalary; }
    public void setGrossSalary(BigDecimal grossSalary) { this.grossSalary = grossSalary; }
    public BigDecimal getDeductionLate() { return deductionLate; }
    public void setDeductionLate(BigDecimal deductionLate) { this.deductionLate = deductionLate; }
    public BigDecimal getDeductionUnpaidLeave() { return deductionUnpaidLeave; }
    public void setDeductionUnpaidLeave(BigDecimal deductionUnpaidLeave) { this.deductionUnpaidLeave = deductionUnpaidLeave; }
    public BigDecimal getInsuranceDeduction() { return insuranceDeduction; }
    public void setInsuranceDeduction(BigDecimal insuranceDeduction) { this.insuranceDeduction = insuranceDeduction; }
    public BigDecimal getTaxDeduction() { return taxDeduction; }
    public void setTaxDeduction(BigDecimal taxDeduction) { this.taxDeduction = taxDeduction; }
    public BigDecimal getTotalDeductions() { return totalDeductions; }
    public void setTotalDeductions(BigDecimal totalDeductions) { this.totalDeductions = totalDeductions; }
    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getAdjustmentsDetail() { return adjustmentsDetail; }
    public void setAdjustmentsDetail(String adjustmentsDetail) { this.adjustmentsDetail = adjustmentsDetail; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
}
