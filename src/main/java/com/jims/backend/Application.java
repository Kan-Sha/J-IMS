package com.jims.backend;

import com.jims.backend.controller.AuthController;
import com.jims.backend.controller.ClassController;
import com.jims.backend.controller.StaffController;
import com.jims.backend.controller.StudentController;
import com.jims.backend.controller.LearningStatusController;
import com.jims.backend.repository.ClassRepository;
import com.jims.backend.repository.StaffRepository;
import com.jims.backend.repository.StudentRepository;
import com.jims.backend.repository.LearningStatusRepository;
import com.jims.backend.service.AuthService;
import com.jims.backend.service.StaffService;
import com.jims.backend.service.StudentService;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class Application {
    public static void main(String[] args) throws IOException {
         int port = resolvePort();

        StaffRepository staffRepository = new StaffRepository();
        StudentRepository studentRepository = new StudentRepository();
        ClassRepository classRepository = new ClassRepository();
        LearningStatusRepository learningStatusRepository = new LearningStatusRepository();

        StaffService staffService = new StaffService(staffRepository);
        AuthService authService = new AuthService(staffRepository);
        StudentService studentService = new StudentService(studentRepository, classRepository);

        StaffController staffController = new StaffController(staffService);
        AuthController authController = new AuthController(authService);
        StudentController studentController = new StudentController(studentService);
        LearningStatusController learningStatusController = new LearningStatusController(learningStatusRepository);
        ClassController classController = new ClassController(classRepository);

        try {
            learningStatusRepository.ensureDefaultVietnameseStatuses();
        } catch (Exception e) {
            System.err.println("Failed to ensure default learning statuses: " + e.getMessage());
        }

        try {
            staffRepository.ensureDefaultRoles();
        } catch (Exception e) {
            System.err.println("Failed to ensure default roles: " + e.getMessage());
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/api/staff", staffController.createStaffHandler());
        server.createContext("/api/auth/login", authController.loginHandler());
        server.createContext("/api/auth/logout", authController.logoutHandler());
        server.createContext("/api/auth/session", authController.sessionHandler());
        server.createContext("/api/students", studentController.createStudentHandler());
        server.createContext("/api/students/next-id", studentController.nextStudentIdHandler());
        server.createContext("/api/classes", classController.listClassesHandler());
        server.createContext("/api/learning-status", learningStatusController.listStatusesHandler());

        server.setExecutor(Executors.newCachedThreadPool());
        server.start();

        System.out.println("J-IMS backend started on port " + port);
    }

    private static int resolvePort() {
        String fromEnv = System.getenv("JIMS_PORT");
        if (fromEnv != null && !fromEnv.trim().isEmpty()) {
            try {
                return Integer.parseInt(fromEnv.trim());
            } catch (NumberFormatException ignored) {
            }
        }
        return 8080;
    }
}
