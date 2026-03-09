package com.jims.backend.http;

import com.jims.backend.dto.LoginRequest;
import com.jims.backend.service.ApiException;
import com.jims.backend.service.AuthService;
import com.jims.backend.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class AuthHandler implements HttpHandler {
    private final AuthService authService;

    public AuthHandler(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        try {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                write(exchange, 405, "{\"message\":\"Method Not Allowed\"}");
                return;
            }
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            LoginRequest request = JsonUtil.parseLogin(body);
            write(exchange, 200, JsonUtil.toJson(authService.login(request)));
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
