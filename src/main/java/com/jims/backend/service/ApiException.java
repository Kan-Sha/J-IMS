package com.jims.backend.service;

import com.jims.backend.dto.ErrorResponse;

public class ApiException extends RuntimeException {
    private final int status;
    private final ErrorResponse error;

    public ApiException(int status, ErrorResponse error) {
        super(error.getMessage());
        this.status = status;
        this.error = error;
    }

    public int getStatus() {
        return status;
    }

    public ErrorResponse getError() {
        return error;
    }
}
