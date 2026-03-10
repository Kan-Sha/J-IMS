package com.jims.backend.util;

import com.sun.net.httpserver.HttpExchange;

public final class CorsUtil {
    private static final String ALLOWED_ORIGIN = "http://127.0.0.1:5501";

    private CorsUtil() {
    }

    public static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Staff-Role");
        exchange.getResponseHeaders().set("Access-Control-Allow-Credentials", "true");
    }
}
