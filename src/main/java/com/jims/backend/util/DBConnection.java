package com.jims.backend.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public final class DBConnection {
    private static final String DB_URL = ensureUtf8MysqlUrl(
            getEnv("JIMS_DB_URL", "jdbc:mysql://localhost:3306/jims?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC")
    );
    private static final String DB_USER = getEnv("JIMS_DB_USER", "root");
    private static final String DB_PASSWORD = getEnv("JIMS_DB_PASSWORD", "123456");

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("MySQL JDBC driver not found", e);
        }
    }

    private DBConnection() {
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }

    private static String ensureUtf8MysqlUrl(String url) {
        if (url == null) return null;
        String u = url.trim();
        if (u.isEmpty()) return u;

        String lower = u.toLowerCase();
        boolean hasUseUnicode = lower.contains("useunicode=");
        boolean hasCharEnc = lower.contains("characterencoding=");
        boolean hasCharSetResults = lower.contains("charactersetresults=");

        if (hasUseUnicode && hasCharEnc && hasCharSetResults) {
            return u;
        }

        String sep = u.contains("?") ? "&" : "?";
        StringBuilder sb = new StringBuilder(u);
        if (!hasUseUnicode) sb.append(sep).append("useUnicode=true"); else sep = "&";
        if (!hasCharEnc) sb.append(sep).append("characterEncoding=utf8"); else sep = "&";
        if (!hasCharSetResults) sb.append(sep).append("characterSetResults=utf8");
        return sb.toString();
    }

    private static String getEnv(String key, String defaultValue) {
        String value = System.getenv(key);
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        return value;
    }
}
