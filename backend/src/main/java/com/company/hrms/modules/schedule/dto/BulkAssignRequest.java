package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public class BulkAssignRequest {

    @NotNull(message = "schedule_id không được để trống")
    @JsonProperty("schedule_id")
    private Long scheduleId;

    @NotEmpty(message = "employee_ids không được để trống")
    @JsonProperty("employee_ids")
    private List<Long> employeeIds;

    @NotNull(message = "work_shift_id không được để trống")
    @JsonProperty("work_shift_id")
    private Long workShiftId;

    @NotNull(message = "from_date không được để trống")
    @JsonProperty("from_date")
    private LocalDate fromDate;

    @NotNull(message = "to_date không được để trống")
    @JsonProperty("to_date")
    private LocalDate toDate;

    @NotNull(message = "schedule_version không được để trống")
    @JsonProperty("schedule_version")
    private Integer scheduleVersion;

    public BulkAssignRequest() {
    }

    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }
    public List<Long> getEmployeeIds() { return employeeIds; }
    public void setEmployeeIds(List<Long> employeeIds) { this.employeeIds = employeeIds; }
    public Long getWorkShiftId() { return workShiftId; }
    public void setWorkShiftId(Long workShiftId) { this.workShiftId = workShiftId; }
    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }
    public Integer getScheduleVersion() { return scheduleVersion; }
    public void setScheduleVersion(Integer scheduleVersion) { this.scheduleVersion = scheduleVersion; }
}
