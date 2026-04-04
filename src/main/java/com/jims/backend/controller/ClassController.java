package com.jims.backend.controller;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.jims.backend.repository.ClassRepository;
import com.jims.backend.service.ApiResult;
import com.jims.backend.service.ClassService;
import com.jims.backend.util.JsonUtil;
import com.jims.backend.util.ResponseUtil;
import com.jims.backend.util.UrlEncodingUtil;
import com.jims.backend.util.SessionManager;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ClassController {
    private final ClassRepository classRepository;
    private final ClassService classService;

    public ClassController(ClassRepository classRepository, ClassService classService) {
        this.classRepository = classRepository;
        this.classService = classService;
    }

    /**
     * GET: Sprint-1 dropdown list. POST: OPE-01 create class.
     */
    public HttpHandler classesHandler() {
        return new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    ResponseUtil.handleOptions(exchange);
                    return;
                }

                String token = resolveToken(exchange);
                if (SessionManager.getSession(token) == null) {
                    ResponseUtil.sendJson(exchange, 401, false, Collections.emptyMap(), "Bạn chưa đăng nhập!");
                    return;
                }

                try {
                    if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                        ResponseUtil.sendJson(exchange, 200, true, classRepository.listClasses(), "OK");
                        return;
                    }
                    if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                        SessionManager.SessionData sdSession = SessionManager.getSession(token);
                        if (sdSession == null || sdSession.getRole() == null || !"admin".equalsIgnoreCase(sdSession.getRole().trim())) {
                            ResponseUtil.sendJson(exchange, 403, false, Collections.emptyMap(), "Bạn không có quyền tạo lớp!");
                            return;
                        }
                        JsonObject body = JsonUtil.parseBody(exchange);
                        List<String> days = readDays(body);
                        Integer levelId = body.has("levelId") && !body.get("levelId").isJsonNull()
                                ? Integer.valueOf(body.get("levelId").getAsInt()) : null;
                        Integer teacherId = body.has("teacherId") && !body.get("teacherId").isJsonNull()
                                ? Integer.valueOf(body.get("teacherId").getAsInt()) : null;
                        Integer capacity = body.has("capacity") && !body.get("capacity").isJsonNull()
                                ? Integer.valueOf(body.get("capacity").getAsInt()) : null;

                        ApiResult result = classService.createClass(
                                getString(body, "className"),
                                levelId,
                                teacherId,
                                getString(body, "startDate"),
                                capacity,
                                days,
                                getString(body, "startTime"),
                                getString(body, "endTime")
                        );
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

    public HttpHandler levelsHandler() {
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
                    ResponseUtil.sendJson(exchange, 200, true, classRepository.listLevels(), "OK");
                } catch (Exception e) {
                    ResponseUtil.sendJson(exchange, 500, false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage());
                }
            }
        };
    }

    public HttpHandler manageClassesHandler() {
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
                String raw = exchange.getRequestURI().getRawQuery();
                String search = extractQueryParam(raw, "search");
                ApiResult result = classService.searchClassesForManage(search);
                ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
            }
        };
    }

    public HttpHandler enrollmentHandler() {
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
                SessionManager.SessionData sd = SessionManager.getSession(resolveToken(exchange));
                if (sd == null) {
                    ResponseUtil.sendJson(exchange, 401, false, Collections.emptyMap(), "Bạn chưa đăng nhập!");
                    return;
                }
                if (sd.getRole() == null || !"admin".equalsIgnoreCase(sd.getRole().trim())) {
                    ResponseUtil.sendJson(exchange, 403, false, Collections.emptyMap(), "Bạn không có quyền chỉnh sửa lớp!");
                    return;
                }
                try {
                    JsonObject body = JsonUtil.parseBody(exchange);
                    Integer classId = body.has("classId") && !body.get("classId").isJsonNull()
                            ? Integer.valueOf(body.get("classId").getAsInt()) : null;
                    if (classId == null) {
                        ResponseUtil.sendJson(exchange, 400, false, Collections.emptyMap(), "Thiếu classId!");
                        return;
                    }
                    String action = getString(body, "action");
                    JsonArray sidArr = body.has("studentIds") && body.get("studentIds").isJsonArray()
                            ? body.getAsJsonArray("studentIds") : new JsonArray();
                    List<String> ids = readStringList(sidArr);
                    ApiResult result = classService.changeEnrollment(action, classId.intValue(), ids);
                    ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
                } catch (Exception e) {
                    ResponseUtil.sendJson(exchange, 500, false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage());
                }
            }
        };
    }

    public HttpHandler classDetailHandler() {
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
                String raw = exchange.getRequestURI().getRawQuery();
                String classIdStr = extractQueryParam(raw, "classId");
                int classId;
                try {
                    classId = Integer.parseInt(classIdStr == null ? "" : classIdStr.trim());
                } catch (NumberFormatException e) {
                    ResponseUtil.sendJson(exchange, 400, false, Collections.emptyMap(), "classId không hợp lệ!");
                    return;
                }
                ApiResult result = classService.getClassDetail(classId);
                ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
            }
        };
    }

    /** GET /api/classes/student-count?classId= — synced enrollment vs capacity (FIN-01). */
    public HttpHandler classStudentCountHandler() {
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
                String raw = exchange.getRequestURI().getRawQuery();
                String classIdStr = extractQueryParam(raw, "classId");
                int classId;
                try {
                    classId = Integer.parseInt(classIdStr == null ? "" : classIdStr.trim());
                } catch (NumberFormatException e) {
                    ResponseUtil.sendJson(exchange, 400, false, Collections.emptyMap(), "classId không hợp lệ!");
                    return;
                }
                ApiResult result = classService.getClassStudentCount(classId);
                ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
            }
        };
    }

    /** GET /api/classes/ope03?classId= — minimal data for OPE-03 (name, capacity, students). */
    public HttpHandler ope03ClassHandler() {
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
                String raw = exchange.getRequestURI().getRawQuery();
                String classIdStr = extractQueryParam(raw, "classId");
                int classId;
                try {
                    classId = Integer.parseInt(classIdStr == null ? "" : classIdStr.trim());
                } catch (NumberFormatException e) {
                    ResponseUtil.sendJson(exchange, 400, false, Collections.emptyMap(), "classId không hợp lệ!");
                    return;
                }
                ApiResult result = classService.getOpe03ClassPayload(classId);
                ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
            }
        };
    }

    private static List<String> readDays(JsonObject body) {
        if (body == null || !body.has("days") || body.get("days").isJsonNull()) {
            return null;
        }
        JsonArray arr = body.getAsJsonArray("days");
        List<String> out = new ArrayList<String>();
        for (int i = 0; i < arr.size(); i++) {
            out.add(arr.get(i).getAsString());
        }
        return out;
    }

    private static List<String> readStringList(JsonArray arr) {
        List<String> out = new ArrayList<String>();
        if (arr == null) {
            return out;
        }
        for (int i = 0; i < arr.size(); i++) {
            out.add(arr.get(i).getAsString());
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
            } else if (name.equals(part)) {
                return "";
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
