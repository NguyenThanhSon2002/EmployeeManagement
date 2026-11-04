package com.company.hrms.modules.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public class NotificationDto {

    private Long id;
    private String type;
    private String title;
    private String message;

    @JsonProperty("ref_type")
    private String refType;

    @JsonProperty("ref_id")
    private Long refId;

    @JsonProperty("is_read")
    private Boolean isRead;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    public NotificationDto() {
    }

    public NotificationDto(Long id, String type, String title, String message,
                           String refType, Long refId, Boolean isRead, LocalDateTime createdAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.refType = refType;
        this.refId = refId;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getRefType() { return refType; }
    public void setRefType(String refType) { this.refType = refType; }
    public Long getRefId() { return refId; }
    public void setRefId(Long refId) { this.refId = refId; }
    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}