package com.company.hrms.modules.schedule.dto;

import com.company.hrms.modules.shift.dto.WorkShiftDto;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class WeeklyScheduleResponse {

    @JsonProperty("schedule_id")
    private Long scheduleId;

    @JsonProperty("branch_id")
    private Long branchId;

    @JsonProperty("branch_name")
    private String branchName;

    @JsonProperty("start_date")
    private LocalDate startDate;

    @JsonProperty("end_date")
    private LocalDate endDate;

    private String status;
    private Integer version;

    private List<EmployeeScheduleDto> employees = new ArrayList<>();
    private List<HolidayDto> holidays = new ArrayList<>();

    @JsonProperty("shift_templates")
    private List<WorkShiftDto> shiftTemplates = new ArrayList<>();

    public WeeklyScheduleResponse() {
    }

    public static class EmployeeScheduleDto {
        @JsonProperty("employee_id")
        private Long employeeId;

        @JsonProperty("employee_code")
        private String employeeCode;

        @JsonProperty("full_name")
        private String fullName;

        @JsonProperty("weekly_scheduled_hours")
        private Double weeklyScheduledHours = 0.0;

        private List<ShiftAssignmentDto> assignments = new ArrayList<>();

        public EmployeeScheduleDto() {
        }

        public EmployeeScheduleDto(Long employeeId, String employeeCode, String fullName) {
            this.employeeId = employeeId;
            this.employeeCode = employeeCode;
            this.fullName = fullName;
            this.weeklyScheduledHours = 0.0;
        }

        public Long getEmployeeId() { return employeeId; }
        public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
        public String getEmployeeCode() { return employeeCode; }
        public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public Double getWeeklyScheduledHours() { return weeklyScheduledHours; }
        public void setWeeklyScheduledHours(Double hours) { this.weeklyScheduledHours = hours; }
        public List<ShiftAssignmentDto> getAssignments() { return assignments; }
        public void setAssignments(List<ShiftAssignmentDto> assignments) { this.assignments = assignments; }
    }

    public static class HolidayDto {
        private LocalDate date;
        private String name;

        public HolidayDto() {
        }

        public HolidayDto(LocalDate date, String name) {
            this.date = date;
            this.name = name;
        }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public List<EmployeeScheduleDto> getEmployees() { return employees; }
    public void setEmployees(List<EmployeeScheduleDto> employees) { this.employees = employees; }
    public List<HolidayDto> getHolidays() { return holidays; }
    public void setHolidays(List<HolidayDto> holidays) { this.holidays = holidays; }
    public List<WorkShiftDto> getShiftTemplates() { return shiftTemplates; }
    public void setShiftTemplates(List<WorkShiftDto> shiftTemplates) { this.shiftTemplates = shiftTemplates; }
}
