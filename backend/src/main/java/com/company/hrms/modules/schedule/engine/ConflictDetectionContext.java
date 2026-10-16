package com.company.hrms.modules.schedule.engine;

import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.leave.domain.LeaveRequest;
import com.company.hrms.modules.schedule.domain.CompanyHoliday;
import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import com.company.hrms.modules.shift.domain.WorkShift;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class ConflictDetectionContext {

    private final Long employeeId;
    private final LocalDate workDate;
    private final Long workShiftId;
    private final WorkShift workShift;
    private final LocalDateTime plannedStartTime;
    private final LocalDateTime plannedEndTime;
    private final Long excludeAssignmentId;

    private final Employee employee;
    private final List<ShiftAssignment> existingAssignments;
    private final List<LeaveRequest> approvedLeaves;
    private final List<CompanyHoliday> holidays;
    private final Map<Long, WorkShift> shiftMap;

    private double minRestHours = 11.0;
    private double maxWeeklyHours = 48.0;
    private double maxDailyHours = 12.0;
    private String leaveSeverity = "WARNING";

    public ConflictDetectionContext(
            Long employeeId,
            LocalDate workDate,
            Long workShiftId,
            WorkShift workShift,
            LocalDateTime plannedStartTime,
            LocalDateTime plannedEndTime,
            Long excludeAssignmentId,
            Employee employee,
            List<ShiftAssignment> existingAssignments,
            List<LeaveRequest> approvedLeaves,
            List<CompanyHoliday> holidays,
            Map<Long, WorkShift> shiftMap) {
        this.employeeId = employeeId;
        this.workDate = workDate;
        this.workShiftId = workShiftId;
        this.workShift = workShift;
        this.plannedStartTime = plannedStartTime;
        this.plannedEndTime = plannedEndTime;
        this.excludeAssignmentId = excludeAssignmentId;
        this.employee = employee;
        this.existingAssignments = existingAssignments != null ? existingAssignments : Collections.emptyList();
        this.approvedLeaves = approvedLeaves != null ? approvedLeaves : Collections.emptyList();
        this.holidays = holidays != null ? holidays : Collections.emptyList();
        this.shiftMap = shiftMap != null ? shiftMap : Collections.emptyMap();
    }

    public Long getEmployeeId() { return employeeId; }
    public LocalDate getWorkDate() { return workDate; }
    public Long getWorkShiftId() { return workShiftId; }
    public WorkShift getWorkShift() { return workShift; }
    public LocalDateTime getPlannedStartTime() { return plannedStartTime; }
    public LocalDateTime getPlannedEndTime() { return plannedEndTime; }
    public Long getExcludeAssignmentId() { return excludeAssignmentId; }
    public Employee getEmployee() { return employee; }
    public List<ShiftAssignment> getExistingAssignments() { return existingAssignments; }
    public List<LeaveRequest> getApprovedLeaves() { return approvedLeaves; }
    public List<CompanyHoliday> getHolidays() { return holidays; }
    public Map<Long, WorkShift> getShiftMap() { return shiftMap; }

    public double getMinRestHours() { return minRestHours; }
    public void setMinRestHours(double minRestHours) { this.minRestHours = minRestHours; }
    public double getMaxWeeklyHours() { return maxWeeklyHours; }
    public void setMaxWeeklyHours(double maxWeeklyHours) { this.maxWeeklyHours = maxWeeklyHours; }
    public double getMaxDailyHours() { return maxDailyHours; }
    public void setMaxDailyHours(double maxDailyHours) { this.maxDailyHours = maxDailyHours; }
    public String getLeaveSeverity() { return leaveSeverity; }
    public void setLeaveSeverity(String leaveSeverity) { this.leaveSeverity = leaveSeverity; }
}
