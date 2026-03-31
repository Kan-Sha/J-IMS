package com.jims.backend.controller;

import com.google.gson.JsonObject;
import com.jims.backend.service.ApiResult;
import com.jims.backend.service.StaffService;
import com.jims.backend.util.JsonUtil;
import com.jims.backend.util.ResponseUtil;
import com.jims.backend.util.SessionManager;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.Collections;

public class StaffController {
    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    public HttpHandler staffHandler() {
        return new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    ResponseUtil.handleOptions(exchange);
                    return;
                }
                String method = exchange.getRequestMethod();
                String token = resolveToken(exchange);
                SessionManager.SessionData session = SessionManager.getSession(token);
                if (session == null) {
                    ResponseUtil.sendJson(exchange, 401, false, Collections.emptyMap(), "Bạn chưa đăng nhập!");
                    return;
                }

                String path = exchange.getRequestURI() != null ? exchange.getRequestURI().getPath() : "";
                boolean isTeachers = path != null && path.endsWith("/teachers");

                if ("GET".equalsIgnoreCase(method) && isTeachers) {
                    ApiResult result = staffService.listTeachers(session.getRole());
                    ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
                    return;
                }

                if ("POST".equalsIgnoreCase(method) && !isTeachers) {
                    JsonObject body = JsonUtil.parseBody(exchange);
                    ApiResult result = staffService.createStaff(
                            session.getRole(),
                            getString(body, "fullName"),
                            getString(body, "email"),
                            getString(body, "role")
                    );
                    ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
                    return;
                }

                ResponseUtil.sendJson(exchange, 405, false, null, "Method not allowed");
            }
        };
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
