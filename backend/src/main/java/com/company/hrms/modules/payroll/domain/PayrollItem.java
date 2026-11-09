package com.company.hrms.modules.payroll.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payroll_items")
public class PayrollItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payroll_id", nullable = false)
    private Long payrollId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "employment_type", nullable = false, length = 20)
    private String employmentType = "FULL_TIME";

    @Column(name = "salary_type", nullable = false, length = 20)
    private String salaryType = "MONTHLY";

    @Column(name = "standard_hours", nullable = false, precision = 8, scale = 2)
    private BigDecimal standardHours = BigDecimal.ZERO;

    @Column(name = "actual_hours", nullable = false, precision = 8, scale = 2)
    private BigDecimal actualHours = BigDecimal.ZERO;

    @Column(name = "night_hours", nullable = false, precision = 8, scale = 2)
    private BigDecimal nightHours = BigDecimal.ZERO;

    @Column(name = "late_minutes", nullable = false)
    private Integer lateMinutes = 0;

    @Column(name = "unpaid_leave_days", nullable = false, precision = 5, scale = 2)
    private BigDecimal unpaidLeaveDays = BigDecimal.ZERO;

    @Column(name = "base_pay", nullable = false, precision = 15, scale = 2)
    private BigDecimal basePay = BigDecimal.ZERO;

    @Column(name = "night_pay", nullable = false, precision = 15, scale = 2)
    private BigDecimal nightPay = BigDecimal.ZERO;

    @Column(name = "attendance_bonus", nullable = false, precision = 15, scale = 2)
    private BigDecimal attendanceBonus = BigDecimal.ZERO;

    @Column(name = "allowances_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal allowancesTotal = BigDecimal.ZERO;

    @Column(name = "deduction_late", nullable = false, precision = 15, scale = 2)
    private BigDecimal deductionLate = BigDecimal.ZERO;

    @Column(name = "deduction_unpaid_leave", nullable = false, precision = 15, scale = 2)
    private BigDecimal deductionUnpaidLeave = BigDecimal.ZERO;

    @Column(name = "insurance_deduction", nullable = false, precision = 15, scale = 2)
    private BigDecimal insuranceDeduction = BigDecimal.ZERO;

    @Column(name = "tax_deduction", nullable = false, precision = 15, scale = 2)
    private BigDecimal taxDeduction = BigDecimal.ZERO;

    @Column(name = "gross_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal grossSalary = BigDecimal.ZERO;

    @Column(name = "net_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal netSalary = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "DRAFT";

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public PayrollItem() {
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPayrollId() { return payrollId; }
    public void setPayrollId(Long payrollId) { this.payrollId = payrollId; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
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
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
