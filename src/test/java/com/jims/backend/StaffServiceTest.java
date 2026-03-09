package com.jims.backend;

import com.jims.backend.dto.CreateStaffRequest;
import com.jims.backend.model.Role;
import com.jims.backend.model.Staff;
import com.jims.backend.repository.StaffRepository;
import com.jims.backend.service.ApiException;
import com.jims.backend.service.StaffService;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class StaffServiceTest {
    public static void main(String[] args) throws Exception {
        shouldCreateStaffSuccess();
        shouldCreateStaffWithSlugRole();
        shouldRejectInvalidEmail();
        shouldRejectShortPassword();
        shouldRejectDuplicateEmail();
        System.out.println("All StaffService tests passed.");
    }

    private static void shouldCreateStaffSuccess() {
        StaffService service = new StaffService(new FakeRepo());
        CreateStaffRequest req = new CreateStaffRequest();
        req.setFullName("  Example Name ");
        req.setEmail("example@gmail.com");
        req.setPassword("123456");
        req.setRole("Giáo viên");
        com.jims.backend.dto.StaffResponse response = service.create(req);
        assertEquals("Example Name", response.getFullName(), "full_name trim failed");
        assertEquals("123456", response.getDefaultPassword(), "password should echo input to support AUT-02 login");
    }

    private static void shouldCreateStaffWithSlugRole() {
        StaffService service = new StaffService(new FakeRepo());
        CreateStaffRequest req = new CreateStaffRequest();
        req.setFullName("Role Slug");
        req.setEmail("roleslug@gmail.com");
        req.setPassword("abcdef");
        req.setRole("tro-giang");

        com.jims.backend.dto.StaffResponse response = service.create(req);
        assertEquals("Trợ giảng", response.getRole(), "slug role mapping failed");
    }

    private static void shouldRejectInvalidEmail() {
        StaffService service = new StaffService(new FakeRepo());
        CreateStaffRequest req = new CreateStaffRequest();
        req.setFullName("Example");
        req.setEmail("123456");
        req.setPassword("123456");
        req.setRole("Giáo viên");
        try {
            service.create(req);
            throw new AssertionError("Expected ApiException for invalid email");
        } catch (ApiException e) {
            assertEquals(422, e.getStatus(), "status should be 422");
        }
    }

    private static void shouldRejectShortPassword() {
        StaffService service = new StaffService(new FakeRepo());
        CreateStaffRequest req = new CreateStaffRequest();
        req.setFullName("Example");
        req.setEmail("example2@gmail.com");
        req.setPassword("123");
        req.setRole("Admin");
        try {
            service.create(req);
            throw new AssertionError("Expected ApiException for short password");
        } catch (ApiException e) {
            assertEquals(422, e.getStatus(), "status should be 422");
            assertEquals("Mật khẩu phải có ít nhất 6 ký tự!", e.getError().getMessage(), "password message mismatch");
        }
    }

    private static void shouldRejectDuplicateEmail() throws SQLException {
        FakeRepo repo = new FakeRepo();
        Staff existing = new Staff();
        existing.setStaffId(1);
        existing.setFullName("Existing");
        existing.setEmail("exist@gmail.com");
        existing.setRole(Role.ADMIN);
        repo.save(existing);

        StaffService service = new StaffService(repo);
        CreateStaffRequest req = new CreateStaffRequest();
        req.setFullName("Example");
        req.setEmail("exist@gmail.com");
        req.setPassword("123456");
        req.setRole("Admin");

        try {
            service.create(req);
            throw new AssertionError("Expected ApiException for duplicate email");
        } catch (ApiException e) {
            assertEquals(409, e.getStatus(), "status should be 409");
        }
    }

    private static void assertEquals(Object expected, Object actual, String message) {
        if ((expected == null && actual != null) || (expected != null && !expected.equals(actual))) {
            throw new AssertionError(message + ". expected=" + expected + " actual=" + actual);
        }
    }

    static class FakeRepo implements StaffRepository {
        private final List<Staff> storage = new ArrayList<Staff>();
        private int id = 1;

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
            switch (role) {
                case TEACHER:
                    return 1;
                case ASSISTANT:
                    return 2;
                case ADMIN:
                    return 3;
                case DIRECTOR:
                    return 4;
                default:
                    throw new IllegalArgumentException("Unknown role");
            }
        }

        @Override
        public Staff save(Staff staff) {
            staff.setStaffId(id++);
            storage.add(staff);
            return staff;
        }

        @Override
        public List<Staff> findAll() {
            return storage;
        }
    }
}
