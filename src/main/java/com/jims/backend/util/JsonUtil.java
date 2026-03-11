package com.jims.backend.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import com.sun.net.httpserver.HttpExchange;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public final class JsonUtil {
    private static final Gson GSON = new GsonBuilder().serializeNulls().create();

    private JsonUtil() {
    }

    public static JsonObject parseBody(HttpExchange exchange) throws IOException {
        String body = readBody(exchange.getRequestBody());
        if (body == null || body.trim().isEmpty()) {
            return new JsonObject();
        }
        try {
            return GSON.fromJson(body, JsonObject.class);
        } catch (JsonSyntaxException e) {
            throw new IOException("Invalid JSON body", e);
        }
    }

    public static String toJson(Object obj) {
        return GSON.toJson(obj);
    }

    private static String readBody(InputStream input) throws IOException {
        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
        }
        return builder.toString();
    }
}
