package com.jims.backend.util;

import com.jims.backend.dto.CreateStaffRequest;
import com.jims.backend.dto.ErrorResponse;
import com.jims.backend.dto.LoginRequest;
import com.jims.backend.dto.LoginResponse;
import com.jims.backend.dto.StaffResponse;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class JsonUtil {
    private static final Pattern FIELD_PATTERN = Pattern.compile("\"([^\"]+)\"\\s*:\\s*\"([^\"]*)\"");

    private JsonUtil() {
    }

    public static CreateStaffRequest parseCreateStaff(String body) {
        CreateStaffRequest request = new CreateStaffRequest();
        Matcher matcher = FIELD_PATTERN.matcher(body);
        while (matcher.find()) {
            String key = matcher.group(1);
            String value = matcher.group(2);
            if ("full_name".equals(key)) {
                request.setFullName(value);
            } else if ("email".equals(key)) {
                request.setEmail(value);
            } else if ("role".equals(key)) {
                request.setRole(value);
            }
        }
        return request;
    }

    public static LoginRequest parseLogin(String body) {
        LoginRequest request = new LoginRequest();
        Matcher matcher = FIELD_PATTERN.matcher(body);
        while (matcher.find()) {
            String key = matcher.group(1);
            String value = matcher.group(2);
            if ("email".equals(key)) {
                request.setEmail(value);
            } else if ("password".equals(key)) {
                request.setPassword(value);
            }
        }
        return request;
    }

    public static String toJson(StaffResponse response) {
        return "{"
            + "\"staff_id\":" + response.getStaffId() + ","
            + "\"full_name\":\"" + escape(response.getFullName()) + "\"," 
            + "\"email\":\"" + escape(response.getEmail()) + "\"," 
            + "\"role\":\"" + escape(response.getRole()) + "\"," 
            + "\"default_password\":\"" + escape(response.getDefaultPassword()) + "\""
            + "}";
    }


    public static String toJson(LoginResponse response) {
        return "{"
            + "\"staff_id\":" + response.getStaffId() + ","
            + "\"full_name\":\"" + escape(response.getFullName()) + "\","
            + "\"email\":\"" + escape(response.getEmail()) + "\","
            + "\"role\":\"" + escape(response.getRole()) + "\","
            + "\"redirect_to\":\"" + escape(response.getRedirectTo()) + "\""
            + "}";
    }

    public static String toJson(ErrorResponse error) {
        return "{"
            + "\"code\":\"" + escape(error.getCode()) + "\"," 
            + "\"message\":\"" + escape(error.getMessage()) + "\"," 
            + "\"field\":" + (error.getField() == null ? "null" : "\"" + escape(error.getField()) + "\"")
            + "}";
    }

    public static String toJsonArray(List<StaffResponse> responses) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < responses.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(toJson(responses.get(i)));
        }
        sb.append(']');
        return sb.toString();
    }

    private static String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
