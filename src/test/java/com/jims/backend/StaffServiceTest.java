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
        shouldRejectInvalidEmail();
        shouldRejectDuplicateEmail();
        System.out.println("All StaffService tests passed.");
    }

    private static void shouldCreateStaffSuccess() {
        StaffService service = new StaffService(new FakeRepo());
        CreateStaffRequest req = new CreateStaffRequest();
        req.setFullName("  Example Name ");
        req.setEmail("example@gmail.com");
        req.setRole("Giáo viên");
        var response = service.create(req);
        assertEquals("Example Name", response.getFullName(), "full_name trim failed");
    }

    private static void shouldRejectInvalidEmail() {
        StaffService service = new StaffService(new FakeRepo());
        CreateStaffRequest req = new CreateStaffRequest();
        req.setFullName("Example");
        req.setEmail("123456");
        req.setRole("Giáo viên");
        try {
            service.create(req);
            throw new AssertionError("Expected ApiException for invalid email");
        } catch (ApiException e) {
            assertEquals(422, e.getStatus(), "status should be 422");
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
        private final List<Staff> storage = new ArrayList<>();
        private int id = 1;

        @Override
        public boolean existsByEmail(String email) {
            return storage.stream().anyMatch(s -> s.getEmail().equalsIgnoreCase(email));
        }

        @Override
        public int getRoleIdByName(Role role) {
            return switch (role) {
                case TEACHER -> 1;
                case ASSISTANT -> 2;
                case ADMIN -> 3;
            };
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
