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

public class StaffController {
    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    public HttpHandler createStaffHandler() {
        return new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    ResponseUtil.handleOptions(exchange);
                    return;
                }
                if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                    ResponseUtil.sendJson(exchange, 405, false, null, "Method not allowed");
                    return;
                }

                JsonObject body = JsonUtil.parseBody(exchange);
                String requesterRole = resolveRequesterRole(exchange);

                ApiResult result = staffService.createStaff(
                        requesterRole,
                        getString(body, "fullName"),
                        getString(body, "email"),
                        getString(body, "role")
                );
                ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
            }
        };
    }

    private String resolveRequesterRole(HttpExchange exchange) {
        String fromHeader = exchange.getRequestHeaders().getFirst("X-Staff-Role");
        if (fromHeader != null && !fromHeader.trim().isEmpty()) {
            return fromHeader;
        }

        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        if (authHeader == null || authHeader.trim().isEmpty()) {
            return null;
        }

        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        SessionManager.SessionData session = SessionManager.getSession(token);
        return session == null ? null : session.getRole();
    }

    private String getString(JsonObject object, String key) {
        if (object == null || !object.has(key) || object.get(key).isJsonNull()) {
            return null;
        }
        return object.get(key).getAsString();
    }
}
