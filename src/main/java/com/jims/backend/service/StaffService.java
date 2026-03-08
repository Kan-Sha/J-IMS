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
        try {
            if (staffRepository.existsByEmail(request.getEmail())) {
                throw new ApiException(409, new ErrorResponse("EMAIL_EXISTS", "Email này đã tồn tại!", "email"));
            }
            Staff staff = new Staff();
            staff.setFullName(request.getFullName().trim());
            staff.setEmail(request.getEmail().trim().toLowerCase());
            staff.setRole(Role.fromUiName(request.getRole()));
            staff.setPasswordHash(PasswordUtil.sha256(DEFAULT_PASSWORD));

            Staff saved = staffRepository.save(staff);
            return toResponse(saved);
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
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ApiException(422, new ErrorResponse("VALIDATION_ERROR", "Định dạng email không hợp lệ!", "email"));
        }

        Role role = Role.fromUiName(request.getRole());
        if (role == null) {
            throw new ApiException(422, new ErrorResponse("VALIDATION_ERROR", "Mục này không được để trống!", "role"));
        }
    }

    private StaffResponse toResponse(Staff staff) {
        StaffResponse response = new StaffResponse();
        response.setStaffId(staff.getStaffId());
        response.setFullName(staff.getFullName());
        response.setEmail(staff.getEmail());
        response.setRole(staff.getRole().getUiName());
        response.setDefaultPassword(DEFAULT_PASSWORD);
        return response;
    }
}
