package com.jims.backend.service;

import com.jims.backend.model.Student;
import com.jims.backend.repository.ClassRepository;
import com.jims.backend.repository.StudentRepository;
import com.jims.backend.util.StudentIdGenerator;
import com.jims.backend.util.StudentDobValidator;
import com.jims.backend.util.StudentNameValidator;

import java.sql.Connection;
import java.sql.Date;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

public class StudentService {
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+84|0)[0-9]{9,11}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final StudentRepository studentRepository;
    private final ClassRepository classRepository;

    public StudentService(StudentRepository studentRepository, ClassRepository classRepository) {
        this.studentRepository = studentRepository;
        this.classRepository = classRepository;
    }

    public ApiResult createStudent(String firstName,
                                   String lastName,
                                   String dob,
                                   String gender,
                                   String parentName,
                                   String phone,
                                   String email,
                                   String address,
                                   Integer classId) {
        try {
            Map<String, String> fieldErrors = new LinkedHashMap<String, String>();

            if (isBlank(parentName)) {
                fieldErrors.put("parentName", "Mục này không được để trống!");
            } else {
                String parentTrim = parentName.trim();
                if (parentTrim.length() > 50) {
                    fieldErrors.put("parentName", "Họ tên không được vượt quá 50 ký tự");
                } else if (parentTrim.length() < 8) {
                    fieldErrors.put("parentName", "Họ tên phụ huynh phải có ít nhất 8 ký tự!");
                } else {
                    StudentNameValidator.validateUnicodePersonName(parentTrim).ifPresent(msg -> fieldErrors.put("parentName", msg));
                }
            }

            // STU-01 JSON: firstName = Tên (given), lastName = Họ (family).
            if (isBlank(firstName)) {
                fieldErrors.put("firstName", "Mục này không được để trống!");
            } else {
                String fn = firstName.trim();
                if (fn.length() > 50) {
                    fieldErrors.put("firstName", "Mỗi trường không được vượt quá 50 ký tự!");
                } else {
                    StudentNameValidator.validateStudentTenLetters(fn).ifPresent(msg -> fieldErrors.put("firstName", msg));
                }
            }
            if (isBlank(lastName)) {
                fieldErrors.put("lastName", "Mục này không được để trống!");
            } else {
                String ln = lastName.trim();
                if (ln.length() > 50) {
                    fieldErrors.put("lastName", "Mỗi trường không được vượt quá 50 ký tự!");
                } else {
                    StudentNameValidator.validateStudentHoLetters(ln).ifPresent(msg -> fieldErrors.put("lastName", msg));
                }
            }

            if (isBlank(dob)) {
                fieldErrors.put("dob", "Mục này không được để trống!");
            }
            if (isBlank(phone)) {
                fieldErrors.put("phone", "Mục này không được để trống!");
            }
            if (isBlank(gender)) {
                fieldErrors.put("gender", "Mục này không được để trống!");
            }

            if (!isBlank(phone) && !PHONE_PATTERN.matcher(phone.trim()).matches()) {
                fieldErrors.put("phone", "Số điện thoại không hợp lệ!");
            }

            if (!isBlank(email) && !EMAIL_PATTERN.matcher(email.trim()).matches()) {
                fieldErrors.put("email", "Định dạng email không hợp lệ!");
            }

            LocalDate dobLocalDate = null;
            if (!isBlank(dob)) {
                try {
                    dobLocalDate = LocalDate.parse(dob.trim());
                } catch (DateTimeParseException e) {
                    fieldErrors.put("dob", "Ngày sinh không hợp lệ!");
                }
            }
            if (dobLocalDate != null) {
                Optional<String> dobErr = StudentDobValidator.validateMinimumAgeFive(dobLocalDate);
                dobErr.ifPresent(msg -> fieldErrors.put("dob", msg));
            }

            if (!fieldErrors.isEmpty()) {
                return new ApiResult(false, fieldErrors, "Validation failed", 400);
            }

            if (classId != null && !classRepository.isClassAvailable(classId.intValue())) {
                return new ApiResult(false, Collections.emptyMap(), "Lớp đã đủ sĩ số hoặc không tồn tại!", 400);
            }

            Date dateOfBirth = Date.valueOf(dobLocalDate);
            if (studentRepository.existsDuplicate(firstName.trim(), lastName.trim(), dateOfBirth, phone.trim())) {
                return new ApiResult(false, Collections.emptyMap(), "Học sinh này đã tồn tại trong hệ thống.", 409);
            }

            String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
            String latest = studentRepository.findLatestStudentIdByMonth(yearMonth);
            String studentCode = StudentIdGenerator.generate(latest);

            Student student = new Student();
            student.setStudentId(studentCode);
            student.setFirstName(firstName.trim());
            student.setLastName(lastName.trim());
            student.setDateOfBirth(dateOfBirth);
            student.setGender(gender.trim());
            student.setParentName(parentName.trim());
            student.setPhone(phone.trim());
            student.setEmail(isBlank(email) ? null : email.trim());
            student.setAddress(isBlank(address) ? null : address.trim());
            student.setClassId(classId);

            Connection conn = studentRepository.getConnection();
            try {
                conn.setAutoCommit(false);
                boolean inserted = studentRepository.insertStudent(conn, student);
                if (inserted && classId != null) {
                    inserted = classRepository.incrementClassSize(conn, classId.intValue());
                }
                if (inserted) {
                    conn.commit();
                    Map<String, Object> data = new HashMap<String, Object>();
                    data.put("studentId", studentCode);
                    return new ApiResult(true, data, "Student created successfully", 201);
                }
                conn.rollback();
                return new ApiResult(false, Collections.emptyMap(), "Tạo học sinh thất bại!", 500);
            } finally {
                conn.close();
            }
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    public ApiResult listStudents() {
        try {
            List<Map<String, Object>> students = studentRepository.listStudents();
            return new ApiResult(true, students, "OK", 200);
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    public ApiResult listUnassignedStudents(String search) {
        try {
            List<Map<String, Object>> students = studentRepository.listUnassignedStudents(search);
            return new ApiResult(true, students, "OK", 200);
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    public ApiResult nextStudentId() {
        try {
            String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
            String latest = studentRepository.findLatestStudentIdByMonth(yearMonth);
            String studentCode = StudentIdGenerator.generate(latest);
            Map<String, Object> data = new HashMap<String, Object>();
            data.put("studentId", studentCode);
            return new ApiResult(true, data, "OK", 200);
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
