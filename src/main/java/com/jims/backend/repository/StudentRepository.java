package com.jims.backend.repository;

import com.jims.backend.model.Student;
import com.jims.backend.util.DBConnection;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class StudentRepository {

    public boolean existsDuplicate(String firstName, String lastName, Date dob) throws SQLException {
        String sql = "SELECT 1 FROM students WHERE first_name = ? AND last_name = ? AND date_of_birth = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, firstName);
            stmt.setString(2, lastName);
            stmt.setDate(3, dob);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public String findLatestStudentIdByMonth(String yearMonth) throws SQLException {
        String prefix = "JS-" + yearMonth + "-%";
        String sql = "SELECT student_id FROM students WHERE student_id LIKE ? ORDER BY student_id DESC LIMIT 1";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, prefix);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("student_id");
                }
            }
        }
        return null;
    }

    public boolean insertStudent(Connection conn, Student student) throws SQLException {
        String sql = "INSERT INTO students(student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1))";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, student.getStudentId());
            stmt.setString(2, student.getFirstName());
            stmt.setString(3, student.getLastName());
            stmt.setDate(4, student.getDateOfBirth());
            stmt.setString(5, student.getGender());
            stmt.setString(6, student.getParentName());
            stmt.setString(7, student.getPhone());
            stmt.setString(8, student.getEmail());
            stmt.setString(9, student.getAddress());
            if (student.getClassId() == null) {
                stmt.setNull(10, java.sql.Types.INTEGER);
            } else {
                stmt.setInt(10, student.getClassId().intValue());
            }
            return stmt.executeUpdate() > 0;
        }
    }

    public Connection getConnection() throws SQLException {
        return DBConnection.getConnection();
    }

    public List<Map<String, Object>> listStudents() throws SQLException {
        String sql = "SELECT s.student_id, s.first_name, s.last_name, s.date_of_birth, s.gender, s.class_id, " +
                "c.class_name, s.status_id, COALESCE(ls.status_name, '') AS status_name " +
                "FROM students s " +
                "LEFT JOIN classes c ON s.class_id = c.class_id " +
                "LEFT JOIN learning_status ls ON s.status_id = ls.status_id " +
                "ORDER BY s.created_at DESC, s.student_id DESC";

        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<String, Object>();
                row.put("studentId", rs.getString("student_id"));
                row.put("firstName", rs.getString("first_name"));
                row.put("lastName", rs.getString("last_name"));
                row.put("fullName", (rs.getString("first_name") + " " + rs.getString("last_name")).trim());
                row.put("dob", rs.getDate("date_of_birth").toString());
                row.put("gender", rs.getString("gender"));
                Object classId = rs.getObject("class_id");
                row.put("classId", classId == null ? null : ((Number) classId).intValue());
                row.put("className", rs.getString("class_name"));
                Object statusId = rs.getObject("status_id");
                row.put("statusId", statusId == null ? null : ((Number) statusId).intValue());
                row.put("statusName", rs.getString("status_name"));
                result.add(row);
            }
        }
        return result;
    }
}
