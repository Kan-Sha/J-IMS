package com.jims.backend.controller;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.jims.backend.service.ApiResult;
import com.jims.backend.service.InvoiceService;
import com.jims.backend.util.JsonUtil;
import com.jims.backend.util.ResponseUtil;
import com.jims.backend.util.UrlEncodingUtil;
import com.jims.backend.util.SessionManager;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    public HttpHandler invoicesHandler() {
        return new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    ResponseUtil.handleOptions(exchange);
                    return;
                }

                String token = resolveToken(exchange);
                SessionManager.SessionData sessionData = SessionManager.getSession(token);
                if (sessionData == null) {
                    ResponseUtil.sendJson(exchange, 401, false, Collections.emptyMap(), "Bạn chưa đăng nhập!");
                    return;
                }
                String role = sessionData.getRole() == null ? "" : sessionData.getRole().trim();
                if (!"admin".equalsIgnoreCase(role)) {
                    ResponseUtil.sendJson(exchange, 403, false, Collections.emptyMap(), "Bạn không có quyền truy cập");
                    return;
                }

                try {
                    String path = exchange.getRequestURI().getPath();
                    String base = "/api/invoices";
                    String suffix = path.length() > base.length() ? path.substring(base.length()) : "";

                    if (suffix != null && !suffix.isEmpty() && !"/".equals(suffix)) {
                        handleItemRoute(exchange, suffix);
                        return;
                    }

                    if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                        String raw = exchange.getRequestURI().getRawQuery();
                        String q = extractQueryParam(raw, "q");
                        String classIdStr = extractQueryParam(raw, "classId");
                        Integer classId = null;
                        if (classIdStr != null && !classIdStr.isEmpty()) {
                            try {
                                classId = Integer.valueOf(classIdStr);
                            } catch (NumberFormatException ignored) {
                                ResponseUtil.sendJson(exchange, 400, false, Collections.emptyMap(), "classId không hợp lệ!");
                                return;
                            }
                        }
                        String billingPeriod = extractQueryParam(raw, "billingPeriod");
                        String status = extractQueryParam(raw, "status");
                        int page = parsePositiveInt(extractQueryParam(raw, "page"), 1);
                        int pageSize = parsePositiveInt(extractQueryParam(raw, "pageSize"), 8);
                        ApiResult result = invoiceService.searchInvoices(
                                q.isEmpty() ? null : q,
                                classId,
                                billingPeriod.isEmpty() ? null : billingPeriod,
                                status.isEmpty() ? null : status,
                                page,
                                pageSize
                        );
                        ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
                        return;
                    }

                    if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                        JsonObject body = JsonUtil.parseBody(exchange);
                        Integer classId = body.has("classId") && !body.get("classId").isJsonNull()
                                ? Integer.valueOf(body.get("classId").getAsInt()) : null;
                        if (classId == null) {
                            ResponseUtil.sendJson(exchange, 400, false, Collections.emptyMap(), "Thiếu classId!");
                            return;
                        }
                        String billingPeriod = getString(body, "billingPeriod");
                        int totalSessions = body.has("totalSessions") && !body.get("totalSessions").isJsonNull()
                                ? body.get("totalSessions").getAsInt() : 0;
                        List<InvoiceService.InvoiceLine> lines = readLines(body);
                        ApiResult result = invoiceService.generateInvoice(classId.intValue(), billingPeriod, totalSessions, lines);
                        ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
                        return;
                    }

                    ResponseUtil.sendJson(exchange, 405, false, null, "Method not allowed");
                } catch (Exception e) {
                    ResponseUtil.sendJson(exchange, 500, false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage());
                }
            }
        };
    }

    private void handleItemRoute(HttpExchange exchange, String suffix) throws IOException {
        String normalized = suffix.startsWith("/") ? suffix.substring(1) : suffix;
        String method = exchange.getRequestMethod();
        if ("GET".equalsIgnoreCase(method) && normalized.length() > 0 && normalized.indexOf('/') < 0) {
            ApiResult result = invoiceService.getInvoiceDetail(normalized);
            ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
            return;
        }
        if ("PATCH".equalsIgnoreCase(method) && normalized.endsWith("/payment")) {
            String invoiceId = normalized.substring(0, normalized.length() - "/payment".length());
            JsonObject body = JsonUtil.parseBody(exchange);
            String paymentMethod = getString(body, "paymentMethod");
            String note = getString(body, "note");
            ApiResult result = invoiceService.markInvoicePaid(invoiceId, paymentMethod, note);
            ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
            return;
        }
        ResponseUtil.sendJson(exchange, 405, false, Collections.emptyMap(), "Method not allowed");
    }

    private static List<InvoiceService.InvoiceLine> readLines(JsonObject body) {
        if (body == null || !body.has("lines") || body.get("lines").isJsonNull()) {
            return null;
        }
        JsonArray arr = body.getAsJsonArray("lines");
        List<InvoiceService.InvoiceLine> out = new ArrayList<InvoiceService.InvoiceLine>();
        for (int i = 0; i < arr.size(); i++) {
            JsonObject o = arr.get(i).getAsJsonObject();
            String sid = o.has("studentId") && !o.get("studentId").isJsonNull() ? o.get("studentId").getAsString() : null;
            BigDecimal finalFee = null;
            if (o.has("finalFee") && !o.get("finalFee").isJsonNull()) {
                finalFee = o.get("finalFee").getAsBigDecimal();
            }
            String reason = o.has("adjustmentReason") && !o.get("adjustmentReason").isJsonNull()
                    ? o.get("adjustmentReason").getAsString() : null;
            String name = o.has("studentName") && !o.get("studentName").isJsonNull()
                    ? o.get("studentName").getAsString() : null;
            if (sid != null) {
                out.add(new InvoiceService.InvoiceLine(sid, finalFee, reason, name));
            }
        }
        return out;
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
        for (String cookie : cookieHeader.split(";")) {
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

    private int parsePositiveInt(String raw, int fallback) {
        if (raw == null || raw.trim().isEmpty()) return fallback;
        try {
            int value = Integer.parseInt(raw.trim());
            return value > 0 ? value : fallback;
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }
}
