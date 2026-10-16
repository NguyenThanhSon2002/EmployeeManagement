package com.company.hrms.modules.position.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class PositionDto {

    private Long id;

    @NotBlank(message = "Mã chức danh không được để trống")
    @JsonProperty("position_code")
    private String positionCode;

    @NotBlank(message = "Tên chức danh không được để trống")
    @JsonProperty("position_name")
    private String positionName;

    private String description;

    @JsonProperty("is_active")
    private Boolean isActive;

    public PositionDto() {
    }

    public PositionDto(Long id, String positionCode, String positionName, String description, Boolean isActive) {
        this.id = id;
        this.positionCode = positionCode;
        this.positionName = positionName;
        this.description = description;
        this.isActive = isActive;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPositionCode() { return positionCode; }
    public void setPositionCode(String positionCode) { this.positionCode = positionCode; }
    public String getPositionName() { return positionName; }
    public void setPositionName(String positionName) { this.positionName = positionName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }
}
