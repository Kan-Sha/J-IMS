package com.jims.backend.repository;

import com.jims.backend.model.Staff;
import com.jims.backend.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class StaffRepository {

    public Staff findByEmail(String email) throws SQLException {
        String sql = "SELECT s.staff_id, s.full_name, s.email, s.password_hash, s.role_id, r.role_name " +
                "FROM staff s JOIN roles r ON s.role_id = r.role_id WHERE s.email = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Staff staff = new Staff();
                    staff.setStaffId(rs.getInt("staff_id"));
                    staff.setFullName(rs.getString("full_name"));
                    staff.setEmail(rs.getString("email"));
                    staff.setPasswordHash(rs.getString("password_hash"));
                    staff.setRoleId(rs.getInt("role_id"));
                    staff.setRoleName(rs.getString("role_name"));
                    return staff;
                }
            }
        }
        return null;
    }

    public Integer findRoleIdByRoleName(String roleName) throws SQLException {
        String sql = "SELECT role_id FROM roles WHERE role_name = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, roleName);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("role_id");
                }
            }
        }
        return null;
    }

    public int insertStaff(String fullName, String email, String passwordHash, int roleId) throws SQLException {
        String sql = "INSERT INTO staff(full_name, email, password_hash, role_id) VALUES (?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, fullName);
            stmt.setString(2, email);
            stmt.setString(3, passwordHash);
            stmt.setInt(4, roleId);
            return stmt.executeUpdate();
        }
    }
}
