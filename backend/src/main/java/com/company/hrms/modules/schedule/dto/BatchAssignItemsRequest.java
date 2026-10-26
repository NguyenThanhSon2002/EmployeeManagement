package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchAssignItemsRequest {
    @NotNull(message = "ID lịch làm việc không được để trống")
    @JsonProperty("schedule_id")
    private Long scheduleId;

    @JsonProperty("schedule_version")
    private Integer scheduleVersion;

    @JsonProperty("mode")
    private String mode; // "REPLACE_ALL" | "FILL_MISSING"

    @JsonProperty("from_date")
    private LocalDate fromDate;

    @JsonProperty("to_date")
    private LocalDate toDate;

    @NotEmpty(message = "Danh sách phân ca không được để trống")
    private List<AssignItem> assignments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignItem {
        @NotNull(message = "ID nhân viên không được để trống")
        @JsonProperty("employee_id")
        private Long employeeId;

        @NotNull(message = "ID ca làm việc không được để trống")
        @JsonProperty("work_shift_id")
        private Long workShiftId;

        @NotNull(message = "Ngày làm việc không được để trống")
        @JsonProperty("work_date")
        private LocalDate workDate;

        @JsonProperty("override_rule")
        private String overrideRule;

        @JsonProperty("override_reason")
        private String overrideReason;
    }
}
