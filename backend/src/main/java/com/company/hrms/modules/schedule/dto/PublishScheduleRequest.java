package com.company.hrms.modules.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public class PublishScheduleRequest {

    @NotNull(message = "version không được để trống")
    @JsonProperty("version")
    private Integer version;

    public PublishScheduleRequest() {
    }

    public PublishScheduleRequest(Integer version) {
        this.version = version;
    }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
}
