package com.jims.backend.repository;

import com.jims.backend.model.Role;
import com.jims.backend.model.Staff;
import java.sql.SQLException;
import java.util.List;

public interface StaffRepository {
    boolean existsByEmail(String email) throws SQLException;

    int getRoleIdByName(Role role) throws SQLException;

    Staff save(Staff staff) throws SQLException;

    List<Staff> findAll() throws SQLException;
}
