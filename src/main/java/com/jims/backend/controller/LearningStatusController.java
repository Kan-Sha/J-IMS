package com.jims.backend.controller;

import com.jims.backend.repository.LearningStatusRepository;
import com.jims.backend.util.ResponseUtil;
import com.jims.backend.util.SessionManager;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class LearningStatusController {

    private final LearningStatusRepository learningStatusRepository;

    public LearningStatusController(LearningStatusRepository learningStatusRepository) {
        this.learningStatusRepository = learningStatusRepository;
    }

    public HttpHandler listStatusesHandler() {
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

                try {
                    List<Map<String, Object>> statuses = learningStatusRepository.listAll();
                    ResponseUtil.sendJson(exchange, 200, true, statuses, "OK");
                } catch (SQLException e) {
                    ResponseUtil.sendJson(exchange, 500, false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage());
                }
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
}

