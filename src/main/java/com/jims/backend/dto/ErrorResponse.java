package com.jims.backend.dto;

public class ErrorResponse {
    private String code;
    private String message;
    private String field;

    public ErrorResponse(String code, String message, String field) {
        this.code = code;
        this.message = message;
        this.field = field;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public String getField() {
        return field;
    }
}
