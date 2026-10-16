package com.company.hrms.common.exception;

import org.springframework.http.HttpStatus;

public class ResourceConflictException extends BusinessException {

    public ResourceConflictException(String message) {
        super("RESOURCE_CONFLICT", message, HttpStatus.CONFLICT); // 409
    }
}
