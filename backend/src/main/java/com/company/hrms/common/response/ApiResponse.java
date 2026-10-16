package com.company.hrms.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success = true;
    private T data;
    private Map<String, Object> meta;

    public ApiResponse() {
        this.success = true;
        this.meta = defaultMeta();
    }

    public ApiResponse(boolean success, T data, Map<String, Object> meta) {
        this.success = success;
        this.data = data;
        this.meta = meta != null ? meta : defaultMeta();
    }

    private static Map<String, Object> defaultMeta() {
        return Map.of(
                "timestamp", Instant.now().toString(),
                "request_id", "req-" + UUID.randomUUID().toString().substring(0, 8)
        );
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, defaultMeta());
    }

    public static <T> ApiResponse<T> success(T data, Map<String, Object> meta) {
        return new ApiResponse<>(true, data, meta);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public Map<String, Object> getMeta() {
        return meta;
    }

    public void setMeta(Map<String, Object> meta) {
        this.meta = meta;
    }
}
