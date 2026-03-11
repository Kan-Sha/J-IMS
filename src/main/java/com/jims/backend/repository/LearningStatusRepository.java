package com.jims.backend.repository;

import com.jims.backend.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class LearningStatusRepository {

    public void ensureDefaultVietnameseStatuses() throws SQLException {
        String checkSql = "SELECT 1 FROM learning_status WHERE status_name IN (?, ?) LIMIT 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement check = conn.prepareStatement(checkSql)) {
            check.setString(1, "Đang học");
            check.setString(2, "Nghỉ học");
            try (ResultSet rs = check.executeQuery()) {
                if (rs.next()) {
                    return;
                }
            }
        }

        String insertSql = "INSERT IGNORE INTO learning_status(status_name) VALUES (?), (?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement insert = conn.prepareStatement(insertSql)) {
            insert.setString(1, "Đang học");
            insert.setString(2, "Nghỉ học");
            insert.executeUpdate();
        }
    }

    public List<Map<String, Object>> listAll() throws SQLException {
        String sql = "SELECT status_id, status_name FROM learning_status " +
                "WHERE status_name IN ('Đang học', 'Nghỉ học') " +
                "ORDER BY status_id ASC";
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<String, Object>();
                row.put("statusId", rs.getInt("status_id"));
                row.put("statusName", rs.getString("status_name"));
                result.add(row);
            }
        }
        return result;
    }
}

