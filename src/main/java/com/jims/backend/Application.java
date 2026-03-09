package com.jims.backend;

import com.jims.backend.config.DatabaseConfig;
import com.jims.backend.http.AuthHandler;
import com.jims.backend.http.StaffHandler;
import com.jims.backend.repository.JdbcStaffRepository;
import com.jims.backend.service.AuthService;
import com.jims.backend.service.StaffService;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;

public class Application {
    public static void main(String[] args) throws Exception {
        String dbUrl = System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/jims");
        String dbUser = System.getenv().getOrDefault("DB_USER", "root");
        String dbPassword = System.getenv().getOrDefault("DB_PASSWORD", "");

        DatabaseConfig config = new DatabaseConfig(dbUrl, dbUser, dbPassword);
        JdbcStaffRepository staffRepository = new JdbcStaffRepository(config);
        StaffService staffService = new StaffService(staffRepository);
        AuthService authService = new AuthService(staffRepository);

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/api/v1/staff", new StaffHandler(staffService));
        server.createContext("/api/v1/auth/login", new AuthHandler(authService));
        server.start();

        System.out.println("Server started at http://localhost:8080");
    }
}
