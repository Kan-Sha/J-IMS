package com.jims.backend.repository;

import com.jims.backend.config.DatabaseConfig;
import com.jims.backend.model.Role;
import com.jims.backend.model.Staff;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class JdbcStaffRepository implements StaffRepository {
    private final DatabaseConfig databaseConfig;

    public JdbcStaffRepository(DatabaseConfig databaseConfig) {
        this.databaseConfig = databaseConfig;
    }

    @Override
    public boolean existsByEmail(String email) throws SQLException {
        String sql = "SELECT 1 FROM staff WHERE LOWER(email) = LOWER(?) LIMIT 1";
        try (Connection conn = databaseConfig.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    @Override
    public int getRoleIdByName(Role role) throws SQLException {
        String sql = "SELECT role_id FROM roles WHERE role_name = ? LIMIT 1";
        try (Connection conn = databaseConfig.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, role.getUiName());
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    throw new SQLException("Role chưa được seed trong bảng roles: " + role.getUiName());
                }
                return rs.getInt("role_id");
            }
        }
    }

    @Override
    public Staff save(Staff staff) throws SQLException {
        String insertSql = "INSERT INTO staff (full_name, email, password_hash, role_id) VALUES (?, ?, ?, ?)";
        int roleId = getRoleIdByName(staff.getRole());
        try (Connection conn = databaseConfig.getConnection();
            PreparedStatement ps = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, staff.getFullName());
            ps.setString(2, staff.getEmail());
            ps.setString(3, staff.getPasswordHash());
            ps.setInt(4, roleId);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    staff.setStaffId(keys.getInt(1));
                }
            }
            return staff;
        }
    }

    @Override
    public List<Staff> findAll() throws SQLException {
        String sql = "SELECT s.staff_id, s.full_name, s.email, s.password_hash, r.role_name "
            + "FROM staff s JOIN roles r ON s.role_id = r.role_id ORDER BY s.staff_id DESC";
        try (Connection conn = databaseConfig.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql);
            ResultSet rs = ps.executeQuery()) {
            List<Staff> list = new ArrayList<>();
            while (rs.next()) {
                Staff s = new Staff();
                s.setStaffId(rs.getInt("staff_id"));
                s.setFullName(rs.getString("full_name"));
                s.setEmail(rs.getString("email"));
                s.setPasswordHash(rs.getString("password_hash"));
                s.setRole(Role.fromUiName(rs.getString("role_name")));
                list.add(s);
            }
            return list;
        }
    }
}
