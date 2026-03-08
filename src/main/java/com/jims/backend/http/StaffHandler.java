package com.jims.backend.http;

import com.jims.backend.dto.CreateStaffRequest;
import com.jims.backend.service.ApiException;
import com.jims.backend.service.StaffService;
import com.jims.backend.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class StaffHandler implements HttpHandler {
    private final StaffService staffService;

    public StaffHandler(StaffService staffService) {
        this.staffService = staffService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        try {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                CreateStaffRequest request = JsonUtil.parseCreateStaff(body);
                String payload = JsonUtil.toJson(staffService.create(request));
                write(exchange, 201, payload);
                return;
            }
            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                write(exchange, 200, JsonUtil.toJsonArray(staffService.list()));
                return;
            }
            write(exchange, 405, "{\"message\":\"Method Not Allowed\"}");
        } catch (ApiException e) {
            write(exchange, e.getStatus(), JsonUtil.toJson(e.getError()));
        } catch (Exception e) {
            write(exchange, 500, "{\"message\":\"Internal Server Error\"}");
        }
    }

    private void write(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
