package com.company.hrms.modules.setting.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class UpdateSettingRequest {

    @NotBlank(message = "setting_value không được để trống")
    @JsonProperty("setting_value")
    private String settingValue;

    public UpdateSettingRequest() {
    }

    public UpdateSettingRequest(String settingValue) {
        this.settingValue = settingValue;
    }

    public String getSettingValue() { return settingValue; }
    public void setSettingValue(String settingValue) { this.settingValue = settingValue; }
}
