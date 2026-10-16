package com.company.hrms.modules.leave.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "leave_balances")
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "leave_type_id", nullable = false)
    private Long leaveTypeId;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "total_allocated", nullable = false, precision = 4, scale = 1)
    private BigDecimal totalAllocated = BigDecimal.valueOf(12.0);

    @Column(name = "used_days", nullable = false, precision = 4, scale = 1)
    private BigDecimal usedDays = BigDecimal.ZERO;

    @Column(name = "pending_days", nullable = false, precision = 4, scale = 1)
    private BigDecimal pendingDays = BigDecimal.ZERO;

    @Column(name = "carried_over_days", nullable = false, precision = 4, scale = 1)
    private BigDecimal carriedOverDays = BigDecimal.ZERO;

    public LeaveBalance() {
    }

    public LeaveBalance(Long employeeId, Long leaveTypeId, Integer year, BigDecimal totalAllocated) {
        this.employeeId = employeeId;
        this.leaveTypeId = leaveTypeId;
        this.year = year;
        this.totalAllocated = totalAllocated != null ? totalAllocated : BigDecimal.valueOf(12.0);
        this.usedDays = BigDecimal.ZERO;
        this.pendingDays = BigDecimal.ZERO;
        this.carriedOverDays = BigDecimal.ZERO;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Long getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(Long leaveTypeId) { this.leaveTypeId = leaveTypeId; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public BigDecimal getTotalAllocated() { return totalAllocated; }
    public void setTotalAllocated(BigDecimal totalAllocated) { this.totalAllocated = totalAllocated; }
    public BigDecimal getUsedDays() { return usedDays; }
    public void setUsedDays(BigDecimal usedDays) { this.usedDays = usedDays; }
    public BigDecimal getPendingDays() { return pendingDays; }
    public void setPendingDays(BigDecimal pendingDays) { this.pendingDays = pendingDays; }
    public BigDecimal getCarriedOverDays() { return carriedOverDays; }
    public void setCarriedOverDays(BigDecimal carriedOverDays) { this.carriedOverDays = carriedOverDays; }

    public BigDecimal getRemainingDays() {
        return totalAllocated.add(carriedOverDays).subtract(usedDays).subtract(pendingDays);
    }
}
