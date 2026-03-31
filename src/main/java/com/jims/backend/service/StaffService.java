package com.jims.backend.service;

import com.jims.backend.model.Staff;
import com.jims.backend.model.Role;
import com.jims.backend.repository.StaffRepository;
import com.jims.backend.util.PasswordUtil;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Collections;
import java.util.regex.Pattern;

public class StaffService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final String DEFAULT_STAFF_PASSWORD = "JoyEnglish@123";

    private final StaffRepository staffRepository;

    public StaffService(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    public ApiResult createStaff(String requesterRole, String fullName, String email, String role) {
        try {
            if (!isAdminRole(requesterRole)) {
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

            Integer roleId = resolveRoleId(role);
            if (roleId == null) {
                return new ApiResult(false, Collections.emptyMap(), "Chức vụ không hợp lệ!", 400);
            }

            // Password is fixed by business rule; ignore any client-provided password.
            int inserted = staffRepository.insertStaff(
                    fullName.trim(),
                    email,
                    PasswordUtil.sha256(DEFAULT_STAFF_PASSWORD),
                    roleId.intValue()
            );
            if (inserted > 0) {
                return new ApiResult(true, Collections.emptyMap(), "Account created successfully", 201);
            }

            return new ApiResult(false, Collections.emptyMap(), "Tạo tài khoản thất bại!", 500);
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    public ApiResult listTeachers(String requesterRole) {
        try {
            if (!isAdminRole(requesterRole)) {
                return new ApiResult(false, Collections.emptyMap(), "Bạn không có quyền truy cập!", 403);
            }
            List<Map<String, Object>> teachers = staffRepository.listTeachers();
            return new ApiResult(true, teachers, "OK", 200);
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    private Integer resolveRoleId(String role) throws SQLException {
        Role parsed = Role.fromRequestValue(role);
        if (parsed == null) {
            return null;
        }

        // Candidates cover common DB seeds that may differ across machines/environments.
        switch (parsed) {
            case ADMIN:
                return staffRepository.findRoleIdByAnyRoleNames(new String[]{"Admin", "ADMIN"});
            case TEACHER:
                return staffRepository.findRoleIdByAnyRoleNames(new String[]{
                        "Teacher", "TEACHER",
                        "Giáo viên", "Giao vien"
                });
            case ASSISTANT:
                return staffRepository.findRoleIdByAnyRoleNames(new String[]{
                        "Assistant", "ASSISTANT",
                        "TA", "Trợ giảng", "Tro giang"
                });
            default:
                return null;
        }
    }

    private boolean isAdminRole(String role) {
        Role parsed = Role.fromRequestValue(role);
        return parsed == Role.ADMIN;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
