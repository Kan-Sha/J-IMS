package com.jims.backend.service;

import com.jims.backend.model.Staff;
import com.jims.backend.repository.StaffRepository;
import com.jims.backend.util.PasswordUtil;

import java.sql.SQLException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

public class StaffService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final String DEFAULT_PASSWORD = "JoyEnglish@123";

    private final StaffRepository staffRepository;

    public StaffService(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    public ApiResult createStaff(String requesterRole, String fullName, String email, String role) {
        try {
            if (!"Admin".equalsIgnoreCase(trim(requesterRole))) {
                return new ApiResult(false, Collections.emptyMap(), "Bạn không có quyền tạo tài khoản!", 403);
            }

            if (isBlank(fullName) || isBlank(email) || isBlank(role)) {
                return new ApiResult(false, Collections.emptyMap(), "Mục này không được để trống!", 400);
            }

            email = email.trim();
            if (!EMAIL_PATTERN.matcher(email).matches()) {
                return new ApiResult(false, Collections.emptyMap(), "Định dạng Email không hợp lệ!", 400);
            }

            Staff existing = staffRepository.findByEmail(email);
            if (existing != null) {
                return new ApiResult(false, Collections.emptyMap(), "Email này đã tồn tại!", 409);
            }

            Integer roleId = staffRepository.findRoleIdByRoleName(mapRoleName(role));
            if (roleId == null) {
                return new ApiResult(false, Collections.emptyMap(), "Chức vụ không hợp lệ!", 400);
            }

            int inserted = staffRepository.insertStaff(fullName.trim(), email, PasswordUtil.sha256(DEFAULT_PASSWORD), roleId);
            if (inserted > 0) {
                Map<String, Object> data = new HashMap<String, Object>();
                data.put("defaultPassword", DEFAULT_PASSWORD);
                return new ApiResult(true, data, "Account created successfully", 201);
            }

            return new ApiResult(false, Collections.emptyMap(), "Tạo tài khoản thất bại!", 500);
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    private String mapRoleName(String role) {
        String normalized = trim(role);
        if ("Teacher".equalsIgnoreCase(normalized) || "Giáo viên".equalsIgnoreCase(normalized)) {
            return "Giáo viên";
        }
        if ("TA".equalsIgnoreCase(normalized) || "Trợ giảng".equalsIgnoreCase(normalized)) {
            return "Trợ giảng";
        }
        if ("Admin".equalsIgnoreCase(normalized)) {
            return "Admin";
        }
        return normalized;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
