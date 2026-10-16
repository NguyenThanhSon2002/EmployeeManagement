package com.company.hrms.modules.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class AttendanceRecordDto {

    private Long id;

    @JsonProperty("employee_id")
    private Long employeeId;

    @JsonProperty("shift_assignment_id")
    private Long shiftAssignmentId;

    @JsonProperty("work_date")
    private LocalDate workDate;

    @JsonProperty("check_in_time")
    private LocalDateTime checkInTime;

    @JsonProperty("check_out_time")
    private LocalDateTime checkOutTime;

    @JsonProperty("actual_hours")
    private BigDecimal actualHours;

    @JsonProperty("regular_hours")
    private BigDecimal regularHours;

    @JsonProperty("overtime_hours")
    private BigDecimal overtimeHours;

    @JsonProperty("night_hours")
    private BigDecimal nightHours;

    @JsonProperty("late_minutes")
    private Integer lateMinutes;

    @JsonProperty("early_leave_minutes")
    private Integer earlyLeaveMinutes;

    private String status;
    private String source;

    @JsonProperty("is_manually_corrected")
    private Boolean isManuallyCorrected;

    public AttendanceRecordDto() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Long getShiftAssignmentId() { return shiftAssignmentId; }
    public void setShiftAssignmentId(Long shiftAssignmentId) { this.shiftAssignmentId = shiftAssignmentId; }
    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }
    public LocalDateTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }
    public LocalDateTime getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(LocalDateTime checkOutTime) { this.checkOutTime = checkOutTime; }
    public BigDecimal getActualHours() { return actualHours; }
    public void setActualHours(BigDecimal actualHours) { this.actualHours = actualHours; }
    public BigDecimal getRegularHours() { return regularHours; }
    public void setRegularHours(BigDecimal regularHours) { this.regularHours = regularHours; }
    public BigDecimal getOvertimeHours() { return overtimeHours; }
    public void setOvertimeHours(BigDecimal overtimeHours) { this.overtimeHours = overtimeHours; }
    public BigDecimal getNightHours() { return nightHours; }
    public void setNightHours(BigDecimal nightHours) { this.nightHours = nightHours; }
    public Integer getLateMinutes() { return lateMinutes; }
    public void setLateMinutes(Integer lateMinutes) { this.lateMinutes = lateMinutes; }
    public Integer getEarlyLeaveMinutes() { return earlyLeaveMinutes; }
    public void setEarlyLeaveMinutes(Integer earlyLeaveMinutes) { this.earlyLeaveMinutes = earlyLeaveMinutes; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Boolean getIsManuallyCorrected() { return isManuallyCorrected; }
    public void setIsManuallyCorrected(Boolean manuallyCorrected) { isManuallyCorrected = manuallyCorrected; }
}
