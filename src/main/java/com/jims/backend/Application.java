package com.jims.backend;

import com.jims.backend.controller.AuthController;
import com.jims.backend.controller.StaffController;
import com.jims.backend.controller.StudentController;
import com.jims.backend.repository.ClassRepository;
import com.jims.backend.repository.StaffRepository;
import com.jims.backend.repository.StudentRepository;
import com.jims.backend.service.AuthService;
import com.jims.backend.service.StaffService;
import com.jims.backend.service.StudentService;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class Application {
    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("JIMS_PORT", "8080"));

        StaffRepository staffRepository = new StaffRepository();
        StudentRepository studentRepository = new StudentRepository();
        ClassRepository classRepository = new ClassRepository();

        StaffService staffService = new StaffService(staffRepository);
        AuthService authService = new AuthService(staffRepository);
        StudentService studentService = new StudentService(studentRepository, classRepository);

        StaffController staffController = new StaffController(staffService);
        AuthController authController = new AuthController(authService);
        StudentController studentController = new StudentController(studentService);

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/api/staff", staffController.createStaffHandler());
        server.createContext("/api/auth/login", authController.loginHandler());
        server.createContext("/api/auth/logout", authController.logoutHandler());
        server.createContext("/api/students", studentController.createStudentHandler());

        server.setExecutor(Executors.newCachedThreadPool());
        server.start();

        System.out.println("J-IMS backend started on port " + port);
    }
}
