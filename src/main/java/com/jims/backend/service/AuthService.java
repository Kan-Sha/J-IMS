package com.jims.backend.service;

import com.jims.backend.dto.ErrorResponse;
import com.jims.backend.dto.LoginRequest;
import com.jims.backend.dto.LoginResponse;
import com.jims.backend.model.Staff;
import com.jims.backend.repository.StaffRepository;
import com.jims.backend.util.PasswordUtil;
import java.sql.SQLException;
import java.util.regex.Pattern;

public class AuthService {
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final StaffRepository staffRepository;

    public AuthService(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();
        String password = request.getPassword() == null ? "" : request.getPassword().trim();

        if (email.isEmpty()) {
            throw new ApiException(422, new ErrorResponse("VALIDATION_ERROR", "Mục này không được để trống!", "email"));
        }
        if (password.isEmpty()) {
            throw new ApiException(422, new ErrorResponse("VALIDATION_ERROR", "Mục này không được để trống!", "password"));
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ApiException(422, new ErrorResponse("VALIDATION_ERROR", "Định dạng email không hợp lệ!", "email"));
        }

        try {
            Staff staff = staffRepository.findByEmail(email);
            String hash = PasswordUtil.sha256(password);
            if (staff == null || !hash.equals(staff.getPasswordHash())) {
                throw new ApiException(401, new ErrorResponse("AUTH_FAILED", "Email hoặc mật khẩu không chính xác!", null));
            }
            LoginResponse response = new LoginResponse();
            response.setStaffId(staff.getStaffId());
            response.setFullName(staff.getFullName());
            response.setEmail(staff.getEmail());
            response.setRole(staff.getRole().getUiName());
            response.setRedirectTo(staff.getRole().getDashboardPath());
            return response;
        } catch (SQLException e) {
            throw new ApiException(500, new ErrorResponse("DB_ERROR", "Không thể kết nối cơ sở dữ liệu", null));
        }
    }
}
