package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateOverrideReasonRequest {

    @JsonProperty("override_rule")
    private String overrideRule;

    @JsonProperty("override_reason")
    private String overrideReason;

    @JsonProperty("schedule_version")
    private Integer scheduleVersion;

    public UpdateOverrideReasonRequest() {
    }

    public String getOverrideRule() {
        return overrideRule;
    }

    public void setOverrideRule(String overrideRule) {
        this.overrideRule = overrideRule;
    }

    public String getOverrideReason() {
        return overrideReason;
    }

    public void setOverrideReason(String overrideReason) {
        this.overrideReason = overrideReason;
    }

    public Integer getScheduleVersion() {
        return scheduleVersion;
    }

    public void setScheduleVersion(Integer scheduleVersion) {
        this.scheduleVersion = scheduleVersion;
    }
}
