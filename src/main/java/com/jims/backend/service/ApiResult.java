package com.jims.backend.service;

public class ApiResult {
    private final boolean success;
    private final Object data;
    private final String message;
    private final int statusCode;

    public ApiResult(boolean success, Object data, String message, int statusCode) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.statusCode = statusCode;
    }

    public boolean isSuccess() {
        return success;
    }

    public Object getData() {
        return data;
    }

    public String getMessage() {
        return message;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
