package com.jims.backend.service;

import com.jims.backend.repository.ClassRepository;
import com.jims.backend.repository.InvoiceRepository;
import com.jims.backend.repository.StudentRepository;

import com.jims.backend.config.FeeConstants;
import com.jims.backend.util.BillingPeriodUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.Year;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ClassRepository classRepository;
    private final StudentRepository studentRepository;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          ClassRepository classRepository,
                          StudentRepository studentRepository) {
        this.invoiceRepository = invoiceRepository;
        this.classRepository = classRepository;
        this.studentRepository = studentRepository;
    }

    public ApiResult generateInvoice(int classId,
                                     String billingPeriod,
                                     int totalSessions,
                                     List<InvoiceLine> lines) {
        if (isBlank(billingPeriod)) {
            return new ApiResult(false, Collections.emptyMap(), "Kỳ thanh toán không được để trống!", 400);
        }
        int invoiceYear = Year.now().getValue();
        String canonicalPeriod = BillingPeriodUtil.toCanonical(billingPeriod, invoiceYear);
        if (canonicalPeriod == null) {
            return new ApiResult(false, Collections.emptyMap(),
                    "Kỳ thanh toán không hợp lệ! Dùng dạng \"Tháng 3-4\" hoặc YYYY-MM (ví dụ " + invoiceYear + "-03).", 400);
        }
        if (totalSessions < 1 || totalSessions > 30) {
            return new ApiResult(false, Collections.emptyMap(), "Tổng số buổi không hợp lệ!", 400);
        }

        try {
            Connection conn = studentRepository.getConnection();
            conn.setAutoCommit(false);
            try {
                Map<String, Object> summary = classRepository.getClassSummary(conn, classId);
                if (summary == null) {
                    conn.rollback();
                    return new ApiResult(false, Collections.emptyMap(), "Lớp không tồn tại!", 404);
                }

                if (invoiceRepository.existsInvoiceForClassAndPeriod(conn, classId, canonicalPeriod)) {
                    conn.rollback();
                    return new ApiResult(false, Collections.emptyMap(), "Hóa đơn kỳ " + billingPeriod.trim() + " đã tồn tại!", 409);
                }

                BigDecimal pricePerSession = (BigDecimal) summary.get("pricePerSession");
                BigDecimal unitBase = pricePerSession.multiply(BigDecimal.valueOf(totalSessions))
                        .setScale(2, RoundingMode.HALF_UP);

                List<String> targetStudents;
                if (lines == null || lines.isEmpty()) {
                    targetStudents = studentRepository.listStudentIdsInClass(conn, classId);
                } else {
                    targetStudents = new java.util.ArrayList<String>();
                    for (InvoiceLine line : lines) {
                        if (line != null && line.studentId != null && !line.studentId.trim().isEmpty()) {
                            targetStudents.add(line.studentId.trim());
                        }
                    }
                }

                if (targetStudents.isEmpty()) {
                    conn.rollback();
                    return new ApiResult(false, Collections.emptyMap(), "Không có học sinh để lập hóa đơn!", 400);
                }

                Map<String, InvoiceLine> lineByStudent = new LinkedHashMap<String, InvoiceLine>();
                if (lines != null) {
                    for (InvoiceLine line : lines) {
                        if (line != null && line.studentId != null && !line.studentId.trim().isEmpty()) {
                            lineByStudent.put(line.studentId.trim(), line);
                        }
                    }
                }

                for (String sid : targetStudents) {
                    if (!studentRepository.isStudentInClass(conn, sid, classId)) {
                        conn.rollback();
                        return new ApiResult(false, Collections.emptyMap(), "Học sinh không thuộc lớp: " + sid, 400);
                    }
                }

                String invoiceId = nextInvoiceId();

                invoiceRepository.insertInvoice(conn, invoiceId, classId, canonicalPeriod, totalSessions);

                for (String sid : targetStudents) {
                    BigDecimal baseFee = unitBase;
                    InvoiceLine line = lineByStudent.get(sid);
                    BigDecimal finalFee = (line != null && line.finalFee != null)
                            ? line.finalFee.setScale(2, RoundingMode.HALF_UP)
                            : baseFee;
                    String adjReason = line == null ? null : line.adjustmentReason;
                    String studentName = line == null ? null : line.studentName;

                    if (finalFee.compareTo(BigDecimal.ZERO) < 0) {
                        conn.rollback();
                        return new ApiResult(false, Collections.emptyMap(),
                                "Phí cuối cùng không được âm!", 400);
                    }
                    if (finalFee.compareTo(FeeConstants.MAX_FEE_VALUE) > 0) {
                        conn.rollback();
                        return new ApiResult(false, Collections.emptyMap(),
                                "Số tiền vượt quá giới hạn cho phép!", 400);
                    }

                    if (finalFee.compareTo(baseFee) != 0) {
                        if (adjReason == null || adjReason.trim().isEmpty()) {
                            conn.rollback();
                            String nameText = (studentName == null || studentName.trim().isEmpty())
                                    ? sid
                                    : studentName.trim();
                            return new ApiResult(false, Collections.emptyMap(),
                                    "Vui lòng nhập lý do điều chỉnh cho học sinh " + nameText + "!", 400);
                        }
                    }

                    invoiceRepository.insertDetail(conn, invoiceId, sid, baseFee, finalFee, adjReason, "pending");
                }

                conn.commit();
                Map<String, Object> data = new LinkedHashMap<String, Object>();
                data.put("invoiceId", invoiceId);
                data.put("billingPeriod", canonicalPeriod);
                data.put("billingPeriodDisplay", BillingPeriodUtil.toDisplayLabel(canonicalPeriod));
                return new ApiResult(true, data, "Tạo hóa đơn thành công", 201);
            } catch (SQLException e) {
                conn.rollback();
                String m = e.getMessage() != null ? e.getMessage() : "";
                if (m.contains("chk_invoice_detail_adjustment")) {
                    return new ApiResult(false, Collections.emptyMap(),
                            "Phải nhập lý điều chỉnh khi học phí cuối khác học phí cơ sở!", 400);
                }
                return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
            } finally {
                conn.setAutoCommit(true);
                conn.close();
            }
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    private String nextInvoiceId() throws SQLException {
        LocalDate d = LocalDate.now();
        String mmyy = String.format("%02d%02d", d.getMonthValue(), d.getYear() % 100);
        String prefix = "INV-" + mmyy + "-";
        String latest = invoiceRepository.findLatestInvoiceIdWithPrefix(prefix);
        int next = 1;
        if (latest != null) {
            String[] parts = latest.split("-");
            if (parts.length >= 3) {
                try {
                    next = Integer.parseInt(parts[2]) + 1;
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return prefix + String.format("%05d", next);
    }

    public ApiResult searchInvoices(String q, Integer classId, String billingPeriod, String status) {
        try {
            String periodFilter = null;
            if (billingPeriod != null && !billingPeriod.trim().isEmpty()) {
                periodFilter = BillingPeriodUtil.toCanonical(billingPeriod, Year.now().getValue());
                if (periodFilter == null) {
                    return new ApiResult(false, Collections.emptyMap(), "billingPeriod không hợp lệ (YYYY-MM hoặc Tháng X-Y).", 400);
                }
            }
            List<Map<String, Object>> rows = invoiceRepository.searchInvoices(q, classId, periodFilter, status);
            for (Map<String, Object> row : rows) {
                Object bp = row.get("billingPeriod");
                if (bp != null) {
                    row.put("billingPeriodDisplay", BillingPeriodUtil.toDisplayLabel(bp.toString()));
                }
            }
            return new ApiResult(true, rows, "OK", 200);
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    public static final class InvoiceLine {
        public final String studentId;
        public final BigDecimal finalFee;
        public final String adjustmentReason;
        public final String studentName;

        public InvoiceLine(String studentId, BigDecimal finalFee, String adjustmentReason, String studentName) {
            this.studentId = studentId;
            this.finalFee = finalFee;
            this.adjustmentReason = adjustmentReason;
            this.studentName = studentName;
        }
    }
}
