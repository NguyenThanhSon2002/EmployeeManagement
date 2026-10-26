package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeMonthlyScheduleDto {

    @JsonProperty("employee_id")
    private Long employeeId;

    @JsonProperty("month")
    private String month; // "YYYY-MM"

    @JsonProperty("total_shifts")
    private Integer totalShifts;

    @JsonProperty("total_hours")
    private Double totalHours;

    @JsonProperty("earliest_available_month")
    private String earliestAvailableMonth; // "YYYY-MM"

    @JsonProperty("shifts")
    private List<ShiftAssignmentDto> shifts;
}
