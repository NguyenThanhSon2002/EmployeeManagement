package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CopyWeekRequest {

    @NotNull(message = "ID chi nhánh không được để trống")
    @JsonProperty("branch_id")
    private Long branchId;

    @NotNull(message = "Ngày bắt đầu tuần nguồn không được để trống")
    @JsonProperty("source_start_date")
    private LocalDate sourceStartDate;

    @NotNull(message = "Ngày bắt đầu tuần đích không được để trống")
    @JsonProperty("target_start_date")
    private LocalDate targetStartDate;

    @JsonProperty("mode")
    private String mode; // "SKIP_OCCUPIED" | "REPLACE_ALL"
}
