package com.jims.backend.repository;

import com.jims.backend.model.Staff;
import com.jims.backend.util.DBConnection;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class StaffRepository {

    public Staff findById(int staffId) throws SQLException {
        String sql = "SELECT s.staff_id, s.full_name, s.email, s.password_hash, s.role_id, r.role_name " +
                "FROM staff s JOIN roles r ON s.role_id = r.role_id WHERE s.staff_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, staffId);
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

    public int updatePasswordHash(int staffId, String passwordHash) throws SQLException {
        String sql = "UPDATE staff SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE staff_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, passwordHash);
            stmt.setInt(2, staffId);
            return stmt.executeUpdate();
        }
    }

    /**
     * Only Giáo viên / Trợ giảng may be assigned as class teacher (OPE-01).
     */
    public boolean isEligibleClassTeacher(int staffId) throws SQLException {
        String sql = "SELECT 1 FROM staff s JOIN roles r ON s.role_id = r.role_id " +
                "WHERE s.staff_id = ? AND r.role_name IN ('Giáo viên', 'Trợ giảng', 'Teacher', 'Assistant', 'TA')";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, staffId);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public List<Map<String, Object>> listTeachers() throws SQLException {
        String sql = "SELECT s.staff_id, s.full_name, r.role_name " +
                "FROM staff s JOIN roles r ON s.role_id = r.role_id " +
                "WHERE r.role_name IN ('Giáo viên', 'Trợ giảng', 'Teacher', 'Assistant', 'TA') " +
                "ORDER BY s.full_name ASC, s.staff_id ASC";
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<String, Object>();
                row.put("staffId", rs.getInt("staff_id"));
                row.put("fullName", rs.getString("full_name"));
                row.put("roleName", rs.getString("role_name"));
                result.add(row);
            }
        }
        return result;
    }

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

    public Integer findRoleIdByAnyRoleNames(String[] roleNames) throws SQLException {
        if (roleNames == null || roleNames.length == 0) {
            return null;
        }

        for (String roleName : roleNames) {
            Integer roleId = findRoleIdByRoleName(roleName);
            if (roleId != null) {
                return roleId;
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

    public void ensureDefaultRoles() throws SQLException {
        // Keep this idempotent so the system behaves consistently across environments.
        // Insert IGNORE relies on UNIQUE(role_name).
        String sql = "INSERT IGNORE INTO roles(role_name) VALUES " +
                "('Admin'), " +
                "('Teacher'), " +
                "('Assistant'), " +
                "('TA'), " +
                "('Giáo viên'), " +
                "('Trợ giảng'), " +
                "('Giao vien'), " +
                "('Tro giang')";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.executeUpdate();
        }
    }
}
