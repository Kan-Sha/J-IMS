package com.jims.backend.repository;

import com.jims.backend.util.DBConnection;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class InvoiceRepository {

    public boolean existsInvoiceForClassAndPeriod(Connection conn, int classId, String billingPeriod) throws SQLException {
        String sql = "SELECT 1 FROM invoices WHERE class_id = ? AND billing_period = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, classId);
            stmt.setString(2, billingPeriod.trim());
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public void insertInvoice(Connection conn, String invoiceId, int classId, String billingPeriod, int totalSessions) throws SQLException {
        String sql = "INSERT INTO invoices (invoice_id, class_id, billing_period, total_sessions) VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, invoiceId);
            stmt.setInt(2, classId);
            stmt.setString(3, billingPeriod.trim());
            stmt.setInt(4, totalSessions);
            stmt.executeUpdate();
        }
    }

    public void insertDetail(Connection conn,
                             String invoiceId,
                             String studentId,
                             BigDecimal baseFee,
                             BigDecimal finalFee,
                             String adjustmentReason,
                             String status) throws SQLException {
        String sql = "INSERT INTO invoice_details (invoice_id, student_id, base_fee, final_fee, adjustment_reason, status) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, invoiceId);
            stmt.setString(2, studentId);
            stmt.setBigDecimal(3, baseFee);
            stmt.setBigDecimal(4, finalFee);
            if (adjustmentReason == null || adjustmentReason.trim().isEmpty()) {
                stmt.setNull(5, java.sql.Types.VARCHAR);
            } else {
                stmt.setString(5, adjustmentReason.trim());
            }
            stmt.setString(6, status == null ? "pending" : status.trim());
            stmt.executeUpdate();
        }
    }

    public String findLatestInvoiceIdWithPrefix(String prefix) throws SQLException {
        String sql = "SELECT invoice_id FROM invoices WHERE invoice_id LIKE ? ORDER BY invoice_id DESC LIMIT 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, prefix + "%");
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("invoice_id");
                }
            }
        }
        return null;
    }

    public List<Map<String, Object>> searchInvoices(String q,
                                                    Integer classId,
                                                    String billingPeriod,
                                                    String status) throws SQLException {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT DISTINCT i.invoice_id, i.class_id, i.billing_period, i.total_sessions, i.created_at, ");
        sql.append("c.class_name, d.id AS detail_id, d.student_id, d.base_fee, d.final_fee, d.adjustment_reason, d.status, ");
        sql.append("s.first_name, s.last_name ");
        sql.append("FROM invoices i ");
        sql.append("JOIN classes c ON i.class_id = c.class_id ");
        sql.append("JOIN invoice_details d ON d.invoice_id = i.invoice_id ");
        sql.append("JOIN students s ON s.student_id = d.student_id ");
        sql.append("WHERE 1=1 ");

        List<Object> params = new ArrayList<Object>();

        if (q != null && !q.trim().isEmpty()) {
            String term = "%" + q.trim().toLowerCase() + "%";
            sql.append("AND (LOWER(i.invoice_id) LIKE ? OR LOWER(d.student_id) LIKE ? OR ");
            sql.append("LOWER(CONCAT(s.first_name, ' ', s.last_name)) LIKE ?) ");
            params.add(term);
            params.add(term);
            params.add(term);
        }
        if (classId != null) {
            sql.append("AND i.class_id = ? ");
            params.add(classId);
        }
        if (billingPeriod != null && !billingPeriod.trim().isEmpty()) {
            sql.append("AND i.billing_period = ? ");
            params.add(billingPeriod.trim());
        }
        if (status != null && !status.trim().isEmpty()) {
            sql.append("AND LOWER(d.status) = LOWER(?) ");
            params.add(status.trim());
        }
        sql.append("ORDER BY i.created_at DESC, d.id DESC");

        List<Map<String, Object>> rows = new ArrayList<Map<String, Object>>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                Object p = params.get(i);
                if (p instanceof Integer) {
                    stmt.setInt(i + 1, ((Integer) p).intValue());
                } else {
                    stmt.setString(i + 1, p.toString());
                }
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<String, Object>();
                    row.put("invoiceId", rs.getString("invoice_id"));
                    row.put("classId", rs.getInt("class_id"));
                    row.put("className", rs.getString("class_name"));
                    row.put("billingPeriod", rs.getString("billing_period"));
                    row.put("totalSessions", rs.getInt("total_sessions"));
                    row.put("createdAt", rs.getTimestamp("created_at") != null
                            ? rs.getTimestamp("created_at").toInstant().toString() : null);
                    row.put("detailId", rs.getInt("detail_id"));
                    row.put("studentId", rs.getString("student_id"));
                    row.put("studentName", (rs.getString("last_name") + " " + rs.getString("first_name")).trim());
                    row.put("baseFee", rs.getBigDecimal("base_fee"));
                    row.put("finalFee", rs.getBigDecimal("final_fee"));
                    row.put("adjustmentReason", rs.getString("adjustment_reason"));
                    row.put("status", rs.getString("status"));
                    rows.add(row);
                }
            }
        }
        return rows;
    }
}
