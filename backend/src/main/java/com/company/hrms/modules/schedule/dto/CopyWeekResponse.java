package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CopyWeekResponse {

    @JsonProperty("copied_count")
    private int copiedCount;

    @JsonProperty("skipped_count")
    private int skippedCount;

    @JsonProperty("target_schedule_id")
    private Long targetScheduleId;

    @JsonProperty("message")
    private String message;
}
