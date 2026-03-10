package com.jims.backend.repository;

import com.jims.backend.model.Student;
import com.jims.backend.util.DBConnection;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

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
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
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
            stmt.setInt(10, student.getClassId());
            stmt.setInt(11, 1);
            return stmt.executeUpdate() > 0;
        }
    }

    public Connection getConnection() throws SQLException {
        return DBConnection.getConnection();
    }
}
