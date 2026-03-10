package com.jims.backend.controller;

import com.google.gson.JsonObject;
import com.jims.backend.service.ApiResult;
import com.jims.backend.service.StudentService;
import com.jims.backend.util.JsonUtil;
import com.jims.backend.util.ResponseUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    public HttpHandler createStudentHandler() {
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
                Integer classId = null;
                if (body.has("classId") && !body.get("classId").isJsonNull()) {
                    classId = body.get("classId").getAsInt();
                }

                ApiResult result = studentService.createStudent(
                        getString(body, "firstName"),
                        getString(body, "lastName"),
                        getString(body, "dob"),
                        getString(body, "gender"),
                        getString(body, "parentName"),
                        getString(body, "phone"),
                        getString(body, "email"),
                        getString(body, "address"),
                        classId
                );
                ResponseUtil.sendJson(exchange, result.getStatusCode(), result.isSuccess(), result.getData(), result.getMessage());
            }
        };
    }

    private String getString(JsonObject object, String key) {
        if (object == null || !object.has(key) || object.get(key).isJsonNull()) {
            return null;
        }
        return object.get(key).getAsString();
    }
}
