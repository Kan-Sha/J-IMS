package com.jims.backend.repository;

import com.jims.backend.util.DBConnection;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Time;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ClassRepository {
    public List<Map<String, Object>> listLevels() throws SQLException {
        // OPE-01 business rule: only 2 levels are valid.
        String sql = "SELECT level_id, level_name, price_per_session " +
                "FROM levels " +
                "WHERE price_per_session IN (130000, 150000) " +
                "ORDER BY level_id ASC";
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<String, Object>();
                row.put("levelId", rs.getInt("level_id"));
                row.put("levelName", rs.getString("level_name"));
                row.put("pricePerSession", rs.getBigDecimal("price_per_session"));
                result.add(row);
            }
        }
        return result;
    }

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

    public boolean decrementClassSize(Connection conn, int classId) throws SQLException {
        String sql = "UPDATE classes SET current_size = current_size - 1 WHERE class_id = ? AND current_size > 0";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, classId);
            return stmt.executeUpdate() > 0;
        }
    }

    public List<Map<String, Object>> listClasses() throws SQLException {
        String sql = "SELECT class_id, class_name FROM classes WHERE capacity > current_size ORDER BY class_name ASC";
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<String, Object>();
                row.put("classId", rs.getInt("class_id"));
                row.put("className", rs.getString("class_name"));
                result.add(row);
            }
        }
        return result;
    }

    public BigDecimal getPricePerSession(Connection conn, int levelId) throws SQLException {
        String sql = "SELECT price_per_session FROM levels WHERE level_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, levelId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getBigDecimal("price_per_session");
                }
            }
        }
        return null;
    }

    public boolean classNameExists(Connection conn, String className) throws SQLException {
        String sql = "SELECT 1 FROM classes WHERE LOWER(TRIM(class_name)) = LOWER(TRIM(?))";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, className.trim());
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public int insertClass(Connection conn,
                           String className,
                           int levelId,
                           int teacherId,
                           Date startDate,
                           int capacity,
                           BigDecimal tuitionSnapshot) throws SQLException {
        String sql = "INSERT INTO classes (class_name, level_id, teacher_id, start_date, capacity, current_size, tuition_per_session) " +
                "VALUES (?, ?, ?, ?, ?, 0, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, className.trim());
            stmt.setInt(2, levelId);
            stmt.setInt(3, teacherId);
            stmt.setDate(4, startDate);
            stmt.setInt(5, capacity);
            stmt.setBigDecimal(6, tuitionSnapshot);
            stmt.executeUpdate();
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getInt(1);
                }
            }
        }
        throw new SQLException("Failed to obtain class_id");
    }

    public void insertSchedule(Connection conn, int classId, String dayOfWeek, Time start, Time end) throws SQLException {
        String sql = "INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, classId);
            stmt.setString(2, dayOfWeek.trim());
            stmt.setTime(3, start);
            stmt.setTime(4, end);
            stmt.executeUpdate();
        }
    }

    /**
     * True if another class for the same teacher has a schedule on the same day with overlapping time.
     */
    public boolean hasTeacherScheduleOverlap(Connection conn,
                                             int teacherId,
                                             String dayOfWeek,
                                             Time newStart,
                                             Time newEnd,
                                             Integer excludeClassId) throws SQLException {
        String sql = "SELECT 1 FROM class_schedule cs " +
                "JOIN classes c ON cs.class_id = c.class_id " +
                "WHERE c.teacher_id = ? " +
                "AND LOWER(TRIM(cs.day_of_week)) = LOWER(TRIM(?)) " +
                "AND cs.start_time < ? AND cs.end_time > ? " +
                "AND (? IS NULL OR c.class_id <> ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, teacherId);
            stmt.setString(2, dayOfWeek);
            stmt.setTime(3, newEnd);
            stmt.setTime(4, newStart);
            if (excludeClassId == null) {
                stmt.setNull(5, java.sql.Types.INTEGER);
                stmt.setNull(6, java.sql.Types.INTEGER);
            } else {
                stmt.setInt(5, excludeClassId.intValue());
                stmt.setInt(6, excludeClassId.intValue());
            }
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    /**
     * Rows for classes matching search (partial name), joined with staff & levels; one row per schedule row.
     */
    public List<Map<String, Object>> searchClassesFlatRows(String search) throws SQLException {
        String sql = "SELECT c.class_id, c.class_name, c.start_date, c.capacity, c.current_size, " +
                "s.full_name AS teacher_name, l.level_name, l.price_per_session, " +
                "cs.day_of_week, cs.start_time, cs.end_time, cs.schedule_id " +
                "FROM classes c " +
                "JOIN staff s ON c.teacher_id = s.staff_id " +
                "JOIN levels l ON c.level_id = l.level_id " +
                "LEFT JOIN class_schedule cs ON cs.class_id = c.class_id " +
                "WHERE (? = '' OR LOWER(c.class_name) LIKE LOWER(CONCAT('%', ?, '%'))) " +
                "ORDER BY c.start_date DESC, c.class_id DESC, cs.schedule_id ASC";
        List<Map<String, Object>> rows = new ArrayList<Map<String, Object>>();
        String term = search == null ? "" : search.trim();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, term);
            stmt.setString(2, term);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<String, Object>();
                    row.put("classId", rs.getInt("class_id"));
                    row.put("className", rs.getString("class_name"));
                    row.put("startDate", rs.getDate("start_date") != null ? rs.getDate("start_date").toString() : null);
                    row.put("capacity", rs.getInt("capacity"));
                    row.put("currentSize", rs.getInt("current_size"));
                    row.put("teacherName", rs.getString("teacher_name"));
                    row.put("levelName", rs.getString("level_name"));
                    row.put("pricePerSession", rs.getBigDecimal("price_per_session"));
                    row.put("dayOfWeek", rs.getString("day_of_week"));
                    java.sql.Time st = rs.getTime("start_time");
                    java.sql.Time et = rs.getTime("end_time");
                    row.put("startTime", st != null ? st.toString().substring(0, 5) : null);
                    row.put("endTime", et != null ? et.toString().substring(0, 5) : null);
                    rows.add(row);
                }
            }
        }
        return rows;
    }

    public Map<String, Object> getClassSummary(Connection conn, int classId) throws SQLException {
        String sql = "SELECT c.class_id, c.capacity, c.current_size, c.level_id, l.price_per_session " +
                "FROM classes c JOIN levels l ON c.level_id = l.level_id WHERE c.class_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, classId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                Map<String, Object> m = new LinkedHashMap<String, Object>();
                m.put("classId", rs.getInt("class_id"));
                m.put("capacity", rs.getInt("capacity"));
                m.put("currentSize", rs.getInt("current_size"));
                m.put("levelId", rs.getInt("level_id"));
                m.put("pricePerSession", rs.getBigDecimal("price_per_session"));
                return m;
            }
        }
    }
}
