package com.jims.backend.service;

import com.jims.backend.repository.ClassRepository;
import com.jims.backend.repository.InvoiceRepository;
import com.jims.backend.repository.StudentRepository;

import com.jims.backend.config.FeeConstants;
import com.jims.backend.util.BillingPeriodUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.Year;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ClassRepository classRepository;
    private final StudentRepository studentRepository;
    private static final DecimalFormat MONEY_FMT = new DecimalFormat("#,##0");

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

                String prefix = invoicePrefix(canonicalPeriod);
                int nextSeq = nextInvoiceSequence(conn, prefix);
                int createdCount = 0;

                for (String sid : targetStudents) {
                    if (invoiceRepository.existsInvoiceForStudentClassAndPeriod(conn, sid, classId, canonicalPeriod)) {
                        conn.rollback();
                        return new ApiResult(false, Collections.emptyMap(),
                                "Hóa đơn kỳ " + BillingPeriodUtil.toShortDisplay(canonicalPeriod) + " đã tồn tại!", 409);
                    }
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

                    String invoiceId = prefix + String.format("%04d", nextSeq++);
                    invoiceRepository.insertInvoice(conn, invoiceId, classId, sid, canonicalPeriod, totalSessions, finalFee, adjReason);
                    invoiceRepository.insertDetail(conn, invoiceId, sid, baseFee, finalFee, adjReason, "pending");
                    createdCount++;
                }

                conn.commit();
                Map<String, Object> data = new LinkedHashMap<String, Object>();
                data.put("createdInvoices", createdCount);
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

    private String invoicePrefix(String canonicalPeriod) {
        YearMonth ym = YearMonth.parse(canonicalPeriod);
        String mmyy = String.format("%02d%02d", ym.getMonthValue(), ym.getYear() % 100);
        return "INV-" + mmyy + "-";
    }

    private int nextInvoiceSequence(Connection conn, String prefix) throws SQLException {
        String latest = invoiceRepository.findLatestInvoiceIdWithPrefix(conn, prefix);
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
        return next;
    }

    public ApiResult searchInvoices(String q, Integer classId, String billingPeriod, String status, int page, int pageSize) {
        try {
            String periodFilter = null;
            if (billingPeriod != null && !billingPeriod.trim().isEmpty()) {
                periodFilter = BillingPeriodUtil.toCanonical(billingPeriod, Year.now().getValue());
                if (periodFilter == null) {
                    return new ApiResult(false, Collections.emptyMap(), "billingPeriod không hợp lệ (YYYY-MM hoặc Tháng X-Y).", 400);
                }
            }
            Map<String, Object> data = invoiceRepository.searchInvoices(q, classId, periodFilter, status, page, pageSize);
            List<Map<String, Object>> rows = (List<Map<String, Object>>) data.get("items");
            for (Map<String, Object> row : rows) {
                Object bp = row.get("billingPeriod");
                if (bp != null) {
                    row.put("billingPeriodDisplay", BillingPeriodUtil.toDisplayLabel(bp.toString()));
                }
                row.put("totalAmountDisplay", formatMoney((BigDecimal) row.get("totalAmount")));
            }
            return new ApiResult(true, data, "OK", 200);
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    public ApiResult getInvoiceDetail(String invoiceId) {
        if (isBlank(invoiceId)) {
            return new ApiResult(false, Collections.emptyMap(), "Mục này không được để trống", 400);
        }
        try {
            Map<String, Object> invoice = invoiceRepository.findInvoiceDetail(invoiceId.trim());
            if (invoice == null) return new ApiResult(false, Collections.emptyMap(), "Không tìm thấy hóa đơn", 404);
            Object bp = invoice.get("billingPeriod");
            if (bp != null) invoice.put("billingPeriodDisplay", BillingPeriodUtil.toDisplayLabel(bp.toString()));
            invoice.put("baseAmountDisplay", formatMoney((BigDecimal) invoice.get("baseAmount")));
            invoice.put("totalAmountDisplay", formatMoney((BigDecimal) invoice.get("totalAmount")));
            if (bp != null) {
                YearMonth ym = YearMonth.parse(bp.toString());
                LocalDate start = ym.atDay(1);
                LocalDate end = ym.plusMonths(1).atEndOfMonth();
                invoice.put("startDate", start.toString());
                invoice.put("endDate", end.toString());
            }
            Object paidAt = invoice.get("paidAt");
            if (paidAt != null) invoice.put("paidAtDisplay", String.valueOf(paidAt).replace("T", " ").replace("Z", ""));
            return new ApiResult(true, invoice, "OK", 200);
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    public ApiResult markInvoicePaid(String invoiceId, String paymentMethod, String note) {
        if (isBlank(invoiceId) || isBlank(paymentMethod)) {
            return new ApiResult(false, Collections.emptyMap(), "Mục này không được để trống", 400);
        }
        String method = paymentMethod.trim();
        if (!"Tiền mặt".equalsIgnoreCase(method) && !"Chuyển khoản".equalsIgnoreCase(method)) {
            return new ApiResult(false, Collections.emptyMap(), "Không hợp lệ", 400);
        }
        try {
            boolean updated = invoiceRepository.markInvoicePaid(invoiceId.trim(), method, note);
            if (!updated) return new ApiResult(false, Collections.emptyMap(), "Không tìm thấy hóa đơn", 404);
            Map<String, Object> invoice = invoiceRepository.findInvoiceDetail(invoiceId.trim());
            if (invoice == null) return new ApiResult(false, Collections.emptyMap(), "Không tìm thấy hóa đơn", 404);
            Object paidAt = invoice.get("paidAt");
            invoice.put("paidAtDisplay", paidAt == null ? null : String.valueOf(paidAt).replace("T", " ").replace("Z", ""));
            return new ApiResult(true, invoice, "Cập nhật thanh toán thành công", 200);
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0";
        return MONEY_FMT.format(amount.setScale(0, RoundingMode.HALF_UP));
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
