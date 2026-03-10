package com.jims.backend.util;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

public final class ResponseUtil {
    private ResponseUtil() {
    }

    public static void sendJson(HttpExchange exchange, int statusCode, boolean success, Object data, String message) throws IOException {
        CorsUtil.addCorsHeaders(exchange);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("success", success);
        payload.put("data", data == null ? new LinkedHashMap<String, Object>() : data);
        payload.put("message", message == null ? "" : message);

        byte[] response = JsonUtil.toJson(payload).getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, response.length);

        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response);
        }
    }

    public static void handleOptions(HttpExchange exchange) throws IOException {
        CorsUtil.addCorsHeaders(exchange);
        exchange.sendResponseHeaders(204, -1);
        exchange.close();
    }
}
