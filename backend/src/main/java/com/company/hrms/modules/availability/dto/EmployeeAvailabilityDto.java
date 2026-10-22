package com.company.hrms.modules.availability.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeAvailabilityDto {

    @JsonProperty("employee_id")
    private Long employeeId;

    // Map: dayOfWeek (1..7) -> List<workShiftId>
    private Map<Integer, List<Long>> availabilities;
}
