package com.jims.backend.util;

import com.sun.net.httpserver.HttpExchange;

public final class CorsUtil {
    private static final String[] ALLOWED_ORIGIN_PREFIXES = new String[]{
            "http://127.0.0.1:",
            "http://localhost:"
    };

    private CorsUtil() {
    }

    public static void addCorsHeaders(HttpExchange exchange) {
        String origin = exchange.getRequestHeaders().getFirst("Origin");
        String allowedOrigin = resolveAllowedOrigin(origin);
        if (allowedOrigin != null) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", allowedOrigin);
            exchange.getResponseHeaders().set("Vary", "Origin");
        }
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Staff-Role");
        exchange.getResponseHeaders().set("Access-Control-Allow-Credentials", "true");
    }

    private static String resolveAllowedOrigin(String origin) {
        if (origin == null || origin.trim().isEmpty()) {
            return null;
        }
        String trimmed = origin.trim();
        for (String prefix : ALLOWED_ORIGIN_PREFIXES) {
            if (trimmed.startsWith(prefix)) {
                return trimmed;
            }
        }
        return null;
    }
}
