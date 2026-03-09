package com.jims.backend;

import com.jims.backend.dto.LoginRequest;
import com.jims.backend.model.Role;
import com.jims.backend.model.Staff;
import com.jims.backend.repository.StaffRepository;
import com.jims.backend.service.ApiException;
import com.jims.backend.service.AuthService;
import com.jims.backend.util.PasswordUtil;
import java.util.ArrayList;
import java.util.List;

public class AuthServiceTest {
    public static void main(String[] args) {
        shouldLoginAndReturnDashboardByRole();
        shouldRejectInvalidEmailFormat();
        shouldRejectWrongPassword();
        shouldRejectBlankPassword();
        System.out.println("All AuthService tests passed.");
    }

    private static void shouldLoginAndReturnDashboardByRole() {
        FakeRepo repo = new FakeRepo();
        repo.addStaff(1, "Admin User", "admin@gmail.com", "correct-password", Role.ADMIN);

        AuthService service = new AuthService(repo);
        LoginRequest req = new LoginRequest();
        req.setEmail("admin@gmail.com");
        req.setPassword("correct-password");

        com.jims.backend.dto.LoginResponse response = service.login(req);
        assertEquals("/admin/dashboard", response.getRedirectTo(), "admin dashboard path mismatch");
    }

    private static void shouldRejectInvalidEmailFormat() {
        AuthService service = new AuthService(new FakeRepo());
        LoginRequest req = new LoginRequest();
        req.setEmail("1234567890");
        req.setPassword("anything");
        try {
            service.login(req);
            throw new AssertionError("Expected ApiException for invalid email");
        } catch (ApiException e) {
            assertEquals(422, e.getStatus(), "status should be 422");
            assertEquals("Định dạng email không hợp lệ!", e.getError().getMessage(), "message mismatch");
        }
    }

    private static void shouldRejectWrongPassword() {
        FakeRepo repo = new FakeRepo();
        repo.addStaff(2, "Teacher", "teacher@gmail.com", "good-pass", Role.TEACHER);

        AuthService service = new AuthService(repo);
        LoginRequest req = new LoginRequest();
        req.setEmail("teacher@gmail.com");
        req.setPassword("wrong-pass");

        try {
            service.login(req);
            throw new AssertionError("Expected ApiException for wrong password");
        } catch (ApiException e) {
            assertEquals(401, e.getStatus(), "status should be 401");
            assertEquals("Email hoặc mật khẩu không chính xác!", e.getError().getMessage(), "message mismatch");
        }
    }

    private static void shouldRejectBlankPassword() {
        AuthService service = new AuthService(new FakeRepo());
        LoginRequest req = new LoginRequest();
        req.setEmail("user@gmail.com");
        req.setPassword("  ");

        try {
            service.login(req);
            throw new AssertionError("Expected ApiException for blank password");
        } catch (ApiException e) {
            assertEquals(422, e.getStatus(), "status should be 422");
            assertEquals("Mục này không được để trống!", e.getError().getMessage(), "blank field message mismatch");
        }
    }

    private static void assertEquals(Object expected, Object actual, String message) {
        if ((expected == null && actual != null) || (expected != null && !expected.equals(actual))) {
            throw new AssertionError(message + ". expected=" + expected + " actual=" + actual);
        }
    }

    static class FakeRepo implements StaffRepository {
        private final List<Staff> storage = new ArrayList<>();

        void addStaff(int id, String fullName, String email, String rawPassword, Role role) {
            Staff staff = new Staff();
            staff.setStaffId(id);
            staff.setFullName(fullName);
            staff.setEmail(email);
            staff.setPasswordHash(PasswordUtil.sha256(rawPassword));
            staff.setRole(role);
            storage.add(staff);
        }

        @Override
        public boolean existsByEmail(String email) {
            return storage.stream().anyMatch(s -> s.getEmail().equalsIgnoreCase(email));
        }

        @Override
        public Staff findByEmail(String email) {
            return storage.stream().filter(s -> s.getEmail().equalsIgnoreCase(email)).findFirst().orElse(null);
        }

        @Override
        public int getRoleIdByName(Role role) {
            return 0;
        }

        @Override
        public Staff save(Staff staff) {
            storage.add(staff);
            return staff;
        }

        @Override
        public List<Staff> findAll() {
            return storage;
        }
    }
}
