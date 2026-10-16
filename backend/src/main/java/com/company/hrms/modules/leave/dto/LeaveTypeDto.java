package com.company.hrms.modules.leave.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class LeaveTypeDto {

    private Long id;

    @JsonProperty("type_code")
    private String typeCode;

    @JsonProperty("type_name")
    private String typeName;

    @JsonProperty("is_paid")
    private Boolean isPaid;

    @JsonProperty("requires_attachment")
    private Boolean requiresAttachment;

    public LeaveTypeDto() {
    }

    public LeaveTypeDto(Long id, String typeCode, String typeName, Boolean isPaid, Boolean requiresAttachment) {
        this.id = id;
        this.typeCode = typeCode;
        this.typeName = typeName;
        this.isPaid = isPaid;
        this.requiresAttachment = requiresAttachment;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTypeCode() { return typeCode; }
    public void setTypeCode(String typeCode) { this.typeCode = typeCode; }
    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }
    public Boolean getIsPaid() { return isPaid; }
    public void setIsPaid(Boolean paid) { isPaid = paid; }
    public Boolean getRequiresAttachment() { return requiresAttachment; }
    public void setRequiresAttachment(Boolean requiresAttachment) { this.requiresAttachment = requiresAttachment; }
}
