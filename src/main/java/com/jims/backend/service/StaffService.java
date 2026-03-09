package com.jims.backend.service;

import com.jims.backend.dto.CreateStaffRequest;
import com.jims.backend.dto.ErrorResponse;
import com.jims.backend.dto.StaffResponse;
import com.jims.backend.model.Role;
import com.jims.backend.model.Staff;
import com.jims.backend.repository.StaffRepository;
import com.jims.backend.util.PasswordUtil;
import java.sql.SQLException;
import java.util.List;
import java.util.regex.Pattern;

public class StaffService {
    public static final String DEFAULT_PASSWORD = "JoyEnglish@123";
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final StaffRepository staffRepository;

    public StaffService(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    public StaffResponse create(CreateStaffRequest request) {
        validate(request);
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String rawPassword = request.getPassword().trim();

        try {
            if (staffRepository.existsByEmail(normalizedEmail)) {
                throw new ApiException(409, new ErrorResponse("EMAIL_EXISTS", "Email này đã tồn tại!", "email"));
            }
            Staff staff = new Staff();
            staff.setFullName(request.getFullName().trim());
            staff.setEmail(normalizedEmail);
            staff.setRole(Role.fromUiName(request.getRole()));
            staff.setPasswordHash(PasswordUtil.sha256(rawPassword));

            Staff saved = staffRepository.save(staff);
            return toResponse(saved, rawPassword);
        } catch (SQLException e) {
            throw new ApiException(500, new ErrorResponse("DB_ERROR", "Không thể kết nối cơ sở dữ liệu", null));
        }
    }

    public List<StaffResponse> list() {
        try {
            return staffRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(java.util.stream.Collectors.toList());
        } catch (SQLException e) {
            throw new ApiException(500, new ErrorResponse("DB_ERROR", "Không thể tải danh sách nhân viên", null));
        }
    }

    private void validate(CreateStaffRequest request) {
        String fullName = request.getFullName() == null ? "" : request.getFullName().trim();
        if (fullName.isEmpty()) {
            throw new ApiException(422, new ErrorResponse("VALIDATION_ERROR", "Mục này không được để trống!", "full_name"));
        }

        String email = request.getEmail() == null ? "" : request.getEmail().trim();
        if (email.isEmpty()) {
            throw new ApiException(422, new ErrorResponse("VALIDATION_ERROR", "Mục này không được để trống!", "email"));
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ApiException(422, new ErrorResponse("VALIDATION_ERROR", "Định dạng email không hợp lệ!", "email"));
        }

        String password = request.getPassword() == null ? "" : request.getPassword().trim();
        if (password.isEmpty()) {
            throw new ApiException(422, new ErrorResponse("VALIDATION_ERROR", "Mục này không được để trống!", "password"));
        }
        if (password.length() < 6) {
            throw new ApiException(422, new ErrorResponse("VALIDATION_ERROR", "Mật khẩu phải có ít nhất 6 ký tự!", "password"));
        }

        Role role = Role.fromUiName(request.getRole());
        if (role == null) {
            throw new ApiException(422, new ErrorResponse("VALIDATION_ERROR", "Mục này không được để trống!", "role"));
        }
    }

    private StaffResponse toResponse(Staff staff) {
        return toResponse(staff, DEFAULT_PASSWORD);
    }

    private StaffResponse toResponse(Staff staff, String rawPassword) {
        StaffResponse response = new StaffResponse();
        response.setStaffId(staff.getStaffId());
        response.setFullName(staff.getFullName());
        response.setEmail(staff.getEmail());
        response.setRole(staff.getRole().getUiName());
        response.setDefaultPassword(rawPassword == null || rawPassword.isEmpty() ? DEFAULT_PASSWORD : rawPassword);
        return response;
    }
}
