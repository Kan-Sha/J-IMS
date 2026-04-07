package com.jims.backend.repository;

import com.jims.backend.util.DBConnection;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class InvoiceRepository {

    public boolean existsInvoiceForStudentClassAndPeriod(Connection conn, String studentId, int classId, String billingPeriod) throws SQLException {
        String sql = "SELECT 1 FROM invoices WHERE student_id = ? AND class_id = ? AND billing_period = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, studentId);
            stmt.setInt(2, classId);
            stmt.setString(3, billingPeriod.trim());
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public void insertInvoice(Connection conn, String invoiceId, int classId, String studentId, String billingPeriod, int totalSessions, BigDecimal finalAmount, String reason) throws SQLException {
        String sql = "INSERT INTO invoices (invoice_id, class_id, student_id, billing_period, total_sessions, final_amount, adjustment_reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, invoiceId);
            stmt.setInt(2, classId);
            stmt.setString(3, studentId);
            stmt.setString(4, billingPeriod.trim());
            stmt.setInt(5, totalSessions);
            stmt.setBigDecimal(6, finalAmount);
            if (reason == null || reason.trim().isEmpty()) stmt.setNull(7, java.sql.Types.VARCHAR);
            else stmt.setString(7, reason.trim());
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

    public String findLatestInvoiceIdWithPrefix(Connection conn, String prefix) throws SQLException {
        String sql = "SELECT invoice_id FROM invoices WHERE invoice_id LIKE ? ORDER BY invoice_id DESC LIMIT 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, prefix + "%");
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("invoice_id");
                }
            }
        }
        return null;
    }

    public Map<String, Object> searchInvoices(String q,
                                              Integer classId,
                                              String billingPeriod,
                                              String status,
                                              int page,
                                              int pageSize) throws SQLException {
        StringBuilder from = new StringBuilder();
        from.append(" FROM invoices i ");
        from.append(" JOIN classes c ON i.class_id = c.class_id ");
        from.append(" JOIN students s ON s.student_id = i.student_id ");
        from.append(" WHERE 1=1 ");

        List<Object> params = new ArrayList<Object>();

        if (q != null && !q.trim().isEmpty()) {
            String term = "%" + q.trim().toLowerCase() + "%";
            from.append("AND (LOWER(i.invoice_id) LIKE ? OR LOWER(i.student_id) LIKE ? OR ");
            from.append("LOWER(CONCAT(COALESCE(s.last_name,''), ' ', COALESCE(s.first_name,''))) LIKE ?) ");
            params.add(term);
            params.add(term);
            params.add(term);
        }
        if (classId != null) {
            from.append("AND i.class_id = ? ");
            params.add(classId);
        }
        if (billingPeriod != null && !billingPeriod.trim().isEmpty()) {
            from.append("AND i.billing_period = ? ");
            params.add(billingPeriod.trim());
        }
        if (status != null && !status.trim().isEmpty()) {
            from.append("AND LOWER(i.status) = LOWER(?) ");
            params.add(status.trim());
        }
        int safePage = Math.max(1, page);
        int safePageSize = Math.max(1, Math.min(100, pageSize));
        int offset = (safePage - 1) * safePageSize;

        String countSql = "SELECT COUNT(1) " + from.toString();
        String dataSql =
                "SELECT i.invoice_id, i.class_id, c.class_name, i.student_id, s.first_name, s.last_name, i.billing_period, i.total_sessions, i.status, i.created_at, " +
                        "i.payment_method, i.paid_at, " +
                        "i.final_amount, i.adjustment_reason " +
                        from.toString() +
                        "ORDER BY i.created_at DESC, i.invoice_id DESC LIMIT ? OFFSET ?";

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        List<Map<String, Object>> items = new ArrayList<Map<String, Object>>();
        try (Connection conn = DBConnection.getConnection()) {
            int total = 0;
            try (PreparedStatement countStmt = conn.prepareStatement(countSql)) {
                bindParams(countStmt, params);
                try (ResultSet rs = countStmt.executeQuery()) {
                    if (rs.next()) total = rs.getInt(1);
                }
            }
            try (PreparedStatement dataStmt = conn.prepareStatement(dataSql)) {
                bindParams(dataStmt, params);
                dataStmt.setInt(params.size() + 1, safePageSize);
                dataStmt.setInt(params.size() + 2, offset);
                try (ResultSet rs = dataStmt.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> row = new LinkedHashMap<String, Object>();
                        row.put("invoiceId", rs.getString("invoice_id"));
                        row.put("classId", rs.getInt("class_id"));
                        row.put("className", rs.getString("class_name"));
                        row.put("studentId", rs.getString("student_id"));
                        row.put("studentName", (rs.getString("last_name") + " " + rs.getString("first_name")).trim());
                        row.put("billingPeriod", rs.getString("billing_period"));
                        row.put("totalSessions", rs.getInt("total_sessions"));
                        row.put("status", rs.getString("status"));
                        row.put("totalAmount", rs.getBigDecimal("final_amount"));
                        row.put("adjustmentReason", rs.getString("adjustment_reason"));
                        row.put("paymentMethod", rs.getString("payment_method"));
                        Timestamp paidAt = rs.getTimestamp("paid_at");
                        row.put("paidAt", paidAt != null ? paidAt.toInstant().toString() : null);
                        items.add(row);
                    }
                }
            }
            result.put("items", items);
            result.put("totalItems", total);
            result.put("page", safePage);
            result.put("pageSize", safePageSize);
        }
        return result;
    }

    public Map<String, Object> findInvoiceDetail(String invoiceId) throws SQLException {
        String invoiceSql = "SELECT i.invoice_id, i.class_id, c.class_name, i.student_id, s.first_name, s.last_name, " +
                "i.billing_period, i.total_sessions, i.status, i.payment_method, i.paid_at, i.created_at, " +
                "i.final_amount, i.adjustment_reason, c.tuition_per_session " +
                "FROM invoices i " +
                "JOIN classes c ON c.class_id = i.class_id " +
                "JOIN students s ON s.student_id = i.student_id " +
                "WHERE i.invoice_id = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement invoiceStmt = conn.prepareStatement(invoiceSql)) {
            invoiceStmt.setString(1, invoiceId);
            try (ResultSet rs = invoiceStmt.executeQuery()) {
                if (!rs.next()) return null;
                Map<String, Object> result = new LinkedHashMap<String, Object>();
                result.put("invoiceId", rs.getString("invoice_id"));
                result.put("classId", rs.getInt("class_id"));
                result.put("className", rs.getString("class_name"));
                result.put("studentId", rs.getString("student_id"));
                result.put("studentName", (rs.getString("last_name") + " " + rs.getString("first_name")).trim());
                result.put("billingPeriod", rs.getString("billing_period"));
                result.put("totalSessions", rs.getInt("total_sessions"));
                result.put("status", rs.getString("status"));
                result.put("unitPrice", rs.getBigDecimal("tuition_per_session"));
                result.put("paymentMethod", rs.getString("payment_method"));
                Timestamp paidAt = rs.getTimestamp("paid_at");
                result.put("paidAt", paidAt != null ? paidAt.toInstant().toString() : null);
                BigDecimal unit = rs.getBigDecimal("tuition_per_session");
                int sessions = rs.getInt("total_sessions");
                BigDecimal base = (unit == null ? BigDecimal.ZERO : unit.multiply(BigDecimal.valueOf(sessions)));
                result.put("baseAmount", base);
                result.put("totalAmount", rs.getBigDecimal("final_amount"));
                result.put("adjustmentReason", rs.getString("adjustment_reason"));
                return result;
            }
        }
    }

    public boolean markInvoicePaid(String invoiceId, String paymentMethod, String note) throws SQLException {
        String updateInvoice = "UPDATE invoices SET status = 'paid', payment_method = ?, paid_at = NOW(), payment_note = ? WHERE invoice_id = ?";
        String updateDetails = "UPDATE invoice_details SET status = 'paid' WHERE invoice_id = ?";
        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement inv = conn.prepareStatement(updateInvoice);
                 PreparedStatement det = conn.prepareStatement(updateDetails)) {
                inv.setString(1, paymentMethod);
                if (note == null || note.trim().isEmpty()) inv.setNull(2, java.sql.Types.VARCHAR);
                else inv.setString(2, note.trim());
                inv.setString(3, invoiceId);
                int updated = inv.executeUpdate();
                if (updated <= 0) {
                    conn.rollback();
                    return false;
                }
                det.setString(1, invoiceId);
                det.executeUpdate();
                conn.commit();
                return true;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private void bindParams(PreparedStatement stmt, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            Object p = params.get(i);
            if (p instanceof Integer) {
                stmt.setInt(i + 1, ((Integer) p).intValue());
            } else if (p == null) {
                stmt.setString(i + 1, null);
            } else {
                stmt.setString(i + 1, p.toString());
            }
        }
    }
}
