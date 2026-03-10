package com.jims.backend.service;

import com.jims.backend.model.Staff;
import com.jims.backend.repository.StaffRepository;
import com.jims.backend.util.PasswordUtil;
import com.jims.backend.util.SessionManager;

import java.sql.SQLException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

public class AuthService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final StaffRepository staffRepository;

    public AuthService(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    public ApiResult login(String email, String password) {
        try {
            if (isBlank(email) || isBlank(password)) {
                return new ApiResult(false, Collections.emptyMap(), "Mục này không được để trống!", 400);
            }

            email = email.trim();
            if (!EMAIL_PATTERN.matcher(email).matches()) {
                return new ApiResult(false, Collections.emptyMap(), "Định dạng Email không hợp lệ!", 400);
            }

            Staff staff = staffRepository.findByEmail(email);
            if (staff == null || !PasswordUtil.sha256(password).equals(staff.getPasswordHash())) {
                return new ApiResult(false, Collections.emptyMap(), "Email hoặc mật khẩu không chính xác!", 401);
            }

            String role = normalizeRole(staff.getRoleName());
            String token = SessionManager.createSession(staff.getStaffId(), role);

            Map<String, Object> data = new LinkedHashMap<String, Object>();
            data.put("staffId", staff.getStaffId());
            data.put("name", staff.getFullName());
            data.put("role", role);
            data.put("redirect", redirectByRole(role));
            data.put("token", token);

            return new ApiResult(true, data, "Login successful", 200);
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    public ApiResult logout(String token) {
        SessionManager.removeSession(token);
        return new ApiResult(true, Collections.emptyMap(), "Logout successful", 200);
    }

    private String redirectByRole(String role) {
        if ("Admin".equals(role)) {
            return "/admin/dashboard";
        }
        if ("Teacher".equals(role)) {
            return "/teacher/dashboard";
        }
        return "/ta/dashboard";
    }

    private String normalizeRole(String roleName) {
        if ("Giáo viên".equalsIgnoreCase(roleName)) {
            return "Teacher";
        }
        if ("Trợ giảng".equalsIgnoreCase(roleName)) {
            return "TA";
        }
        return "Admin";
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
