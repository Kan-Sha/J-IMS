package com.jims.backend.controller;

import com.google.gson.JsonObject;
import com.jims.backend.service.ApiResult;
import com.jims.backend.service.StudentService;
import com.jims.backend.util.JsonUtil;
import com.jims.backend.util.ResponseUtil;
import com.jims.backend.util.SessionManager;
import com.jims.backend.util.UrlEncodingUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.Collections;

public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    public HttpHandler createStudentHandler() {
        return new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    ResponseUtil.handleOptions(exchange);
                    return;
                }
                String token = resolveToken(exchange);
                if (SessionManager.getSession(token) == null) {
                    ResponseUtil.sendJson(exchange, 401, false, Collections.emptyMap(), "Bạn chưa đăng nhập!");
                    return;
                }

                if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                    ApiResult result = studentService.listStudents();
                    ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
                    return;
                }

                if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                    ResponseUtil.sendJson(exchange, 405, false, null, "Method not allowed");
                    return;
                }

                JsonObject body = JsonUtil.parseBody(exchange);
                Integer classId = null;
                if (body.has("classId") && !body.get("classId").isJsonNull()) {
                    classId = body.get("classId").getAsInt();
                }

                ApiResult result = studentService.createStudent(
                        getString(body, "firstName"),
                        getString(body, "lastName"),
                        getString(body, "dob"),
                        getString(body, "gender"),
                        getString(body, "parentName"),
                        getString(body, "phone"),
                        getString(body, "email"),
                        getString(body, "address"),
                        classId
                );
                ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
            }
        };
    }

    public HttpHandler nextStudentIdHandler() {
        return new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    ResponseUtil.handleOptions(exchange);
                    return;
                }
                if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                    ResponseUtil.sendJson(exchange, 405, false, null, "Method not allowed");
                    return;
                }

                String token = resolveToken(exchange);
                if (SessionManager.getSession(token) == null) {
                    ResponseUtil.sendJson(exchange, 401, false, Collections.emptyMap(), "Bạn chưa đăng nhập!");
                    return;
                }

                ApiResult result = studentService.nextStudentId();
                ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
            }
        };
    }

    public HttpHandler unassignedStudentsHandler() {
        return new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    ResponseUtil.handleOptions(exchange);
                    return;
                }
                if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                    ResponseUtil.sendJson(exchange, 405, false, null, "Method not allowed");
                    return;
                }
                String token = resolveToken(exchange);
                if (SessionManager.getSession(token) == null) {
                    ResponseUtil.sendJson(exchange, 401, false, Collections.emptyMap(), "Bạn chưa đăng nhập!");
                    return;
                }
                String raw = exchange.getRequestURI().getRawQuery();
                String search = extractQueryParam(raw, "search");
                ApiResult result = studentService.listUnassignedStudents(search);
                ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
            }
        };
    }

    private static String extractQueryParam(String rawQuery, String name) {
        if (rawQuery == null || rawQuery.isEmpty()) {
            return "";
        }
        for (String part : rawQuery.split("&")) {
            int eq = part.indexOf('=');
            if (eq > 0) {
                String k = part.substring(0, eq);
                if (name.equals(k)) {
                    return UrlEncodingUtil.decodeUtf8(part.substring(eq + 1));
                }
            } else if (name.equals(part)) {
                return "";
            }
        }
        return "";
    }

    private String resolveToken(HttpExchange exchange) {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        if (authHeader != null && !authHeader.trim().isEmpty()) {
            return authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        }

        String cookieHeader = exchange.getRequestHeaders().getFirst("Cookie");
        if (cookieHeader == null || cookieHeader.trim().isEmpty()) {
            return null;
        }
        String[] cookies = cookieHeader.split(";");
        for (String cookie : cookies) {
            String trimmed = cookie.trim();
            if (trimmed.startsWith("JIMS_TOKEN=")) {
                return trimmed.substring("JIMS_TOKEN=".length());
            }
        }
        return null;
    }

    private String getString(JsonObject object, String key) {
        if (object == null || !object.has(key) || object.get(key).isJsonNull()) {
            return null;
        }
        return object.get(key).getAsString();
    }
}
