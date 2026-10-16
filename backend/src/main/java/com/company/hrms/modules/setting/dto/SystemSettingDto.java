package com.company.hrms.modules.setting.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class SystemSettingDto {

    private Long id;

    @NotBlank(message = "setting_key không được để trống")
    @JsonProperty("setting_key")
    private String settingKey;

    @NotBlank(message = "setting_value không được để trống")
    @JsonProperty("setting_value")
    private String settingValue;

    @JsonProperty("data_type")
    private String dataType;

    private String description;

    public SystemSettingDto() {
    }

    public SystemSettingDto(Long id, String settingKey, String settingValue, String dataType, String description) {
        this.id = id;
        this.settingKey = settingKey;
        this.settingValue = settingValue;
        this.dataType = dataType;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSettingKey() { return settingKey; }
    public void setSettingKey(String settingKey) { this.settingKey = settingKey; }
    public String getSettingValue() { return settingValue; }
    public void setSettingValue(String settingValue) { this.settingValue = settingValue; }
    public String getDataType() { return dataType; }
    public void setDataType(String dataType) { this.dataType = dataType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
