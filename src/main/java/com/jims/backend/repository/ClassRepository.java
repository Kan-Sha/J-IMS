package com.jims.backend.repository;

import com.jims.backend.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ClassRepository {
    public boolean isClassAvailable(int classId) throws SQLException {
        String sql = "SELECT capacity, current_size FROM classes WHERE class_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, classId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    int capacity = rs.getInt("capacity");
                    int currentSize = rs.getInt("current_size");
                    return currentSize < capacity;
                }
            }
        }
        return false;
    }

    public boolean incrementClassSize(Connection conn, int classId) throws SQLException {
        String sql = "UPDATE classes SET current_size = current_size + 1 WHERE class_id = ? AND current_size < capacity";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, classId);
            return stmt.executeUpdate() > 0;
        }
    }
}
