package com.company.hrms.modules.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DashboardOverviewDto {

    @JsonProperty("total_employees")
    private long totalEmployees;

    @JsonProperty("present_count")
    private long presentCount;

    @JsonProperty("late_count")
    private long lateCount;

    @JsonProperty("on_leave_count")
    private long onLeaveCount;

    @JsonProperty("active_contract_rate")
    private double activeContractRate;

    @JsonProperty("attendance_rate")
    private double attendanceRate;

    public DashboardOverviewDto() {
    }

    public DashboardOverviewDto(long totalEmployees, long presentCount, long lateCount, long onLeaveCount, double activeContractRate, double attendanceRate) {
        this.totalEmployees = totalEmployees;
        this.presentCount = presentCount;
        this.lateCount = lateCount;
        this.onLeaveCount = onLeaveCount;
        this.activeContractRate = activeContractRate;
        this.attendanceRate = attendanceRate;
    }

    public long getTotalEmployees() { return totalEmployees; }
    public void setTotalEmployees(long totalEmployees) { this.totalEmployees = totalEmployees; }
    public long getPresentCount() { return presentCount; }
    public void setPresentCount(long presentCount) { this.presentCount = presentCount; }
    public long getLateCount() { return lateCount; }
    public void setLateCount(long lateCount) { this.lateCount = lateCount; }
    public long getOnLeaveCount() { return onLeaveCount; }
    public void setOnLeaveCount(long onLeaveCount) { this.onLeaveCount = onLeaveCount; }
    public double getActiveContractRate() { return activeContractRate; }
    public void setActiveContractRate(double activeContractRate) { this.activeContractRate = activeContractRate; }
    public double getAttendanceRate() { return attendanceRate; }
    public void setAttendanceRate(double attendanceRate) { this.attendanceRate = attendanceRate; }
}
