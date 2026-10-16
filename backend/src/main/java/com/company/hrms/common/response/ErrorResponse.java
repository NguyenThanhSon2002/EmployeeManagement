package com.company.hrms.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;

public class ErrorResponse {

    private boolean success = false;
    private ErrorDetail error;

    public ErrorResponse() {
        this.success = false;
    }

    public ErrorResponse(boolean success, ErrorDetail error) {
        this.success = success;
        this.error = error;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetail {
        private String code;
        private String message;
        private List<FieldErrorDetail> details;
        private String timestamp;
        private String path;

        public ErrorDetail() {
        }

        public ErrorDetail(String code, String message, List<FieldErrorDetail> details, String timestamp, String path) {
            this.code = code;
            this.message = message;
            this.details = details;
            this.timestamp = timestamp;
            this.path = path;
        }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public List<FieldErrorDetail> getDetails() { return details; }
        public void setDetails(List<FieldErrorDetail> details) { this.details = details; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }
    }

    public static class FieldErrorDetail {
        private String field;
        @JsonProperty("rejected_value")
        private Object rejectedValue;
        private String message;

        public FieldErrorDetail() {
        }

        public FieldErrorDetail(String field, Object rejectedValue, String message) {
            this.field = field;
            this.rejectedValue = rejectedValue;
            this.message = message;
        }

        public String getField() { return field; }
        public void setField(String field) { this.field = field; }
        public Object getRejectedValue() { return rejectedValue; }
        public void setRejectedValue(Object rejectedValue) { this.rejectedValue = rejectedValue; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static ErrorResponse of(String code, String message, String path, List<FieldErrorDetail> details) {
        ErrorDetail detail = new ErrorDetail(code, message, details, Instant.now().toString(), path);
        return new ErrorResponse(false, detail);
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public ErrorDetail getError() { return error; }
    public void setError(ErrorDetail error) { this.error = error; }
}
