package com.company.hrms.modules.availability.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SaveAvailabilityRequest {

    @JsonProperty("employee_id")
    private Long employeeId;

    // Key: 1..7 (Thứ 2 -> Chủ Nhật), Value: danh sách id ca làm việc
    @NotNull(message = "Danh sách ca không được để trống")
    private Map<Integer, List<Long>> availabilities;
}

