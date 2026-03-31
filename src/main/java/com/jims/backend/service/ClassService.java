package com.jims.backend.service;

import com.jims.backend.repository.ClassRepository;
import com.jims.backend.repository.StaffRepository;
import com.jims.backend.repository.StudentRepository;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.SQLException;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ClassService {

    private final ClassRepository classRepository;
    private final StaffRepository staffRepository;
    private final StudentRepository studentRepository;

    public ClassService(ClassRepository classRepository,
                        StaffRepository staffRepository,
                        StudentRepository studentRepository) {
        this.classRepository = classRepository;
        this.staffRepository = staffRepository;
        this.studentRepository = studentRepository;
    }

    public ApiResult createClass(String className,
                                 Integer levelId,
                                 Integer teacherId,
                                 String startDate,
                                 Integer capacity,
                                 List<String> days,
                                 String startTimeStr,
                                 String endTimeStr) {
        try {
            if (isBlank(className) || levelId == null || teacherId == null || isBlank(startDate)
                    || capacity == null || days == null || isBlank(startTimeStr) || isBlank(endTimeStr)) {
                return new ApiResult(false, Collections.emptyMap(), "Thiếu thông tin bắt buộc!", 400);
            }
            String normalizedClassName = className.trim().toUpperCase();
            if (normalizedClassName.length() < 3 || normalizedClassName.length() > 50) {
                return new ApiResult(false, Collections.emptyMap(), "Tên lớp học không hợp lệ!", 400);
            }
            if (capacity.intValue() < 3 || capacity.intValue() > 18) {
                return new ApiResult(false, Collections.emptyMap(), "Số lượng học sinh không phù hợp!", 400);
            }
            if (days.size() != 2) {
                return new ApiResult(false, Collections.emptyMap(), "Mỗi lớp phải có đúng 2 buổi học trong tuần!", 400);
            }
            Set<String> distinctDays = new LinkedHashSet<String>();
            for (String d : days) {
                if (d == null || d.trim().isEmpty()) {
                    return new ApiResult(false, Collections.emptyMap(), "Ngày học không hợp lệ!", 400);
                }
                distinctDays.add(d.trim().toLowerCase());
            }
            if (distinctDays.size() != 2) {
                return new ApiResult(false, Collections.emptyMap(), "Hai ngày học phải khác nhau!", 400);
            }

            if (!staffRepository.isEligibleClassTeacher(teacherId.intValue())) {
                return new ApiResult(false, Collections.emptyMap(), "Giáo viên phụ trách không hợp lệ!", 400);
            }

            LocalDate sd;
            try {
                sd = LocalDate.parse(startDate.trim());
            } catch (DateTimeParseException e) {
                return new ApiResult(false, Collections.emptyMap(), "Ngày bắt đầu không hợp lệ!", 400);
            }

            LocalTime st;
            LocalTime et;
            try {
                st = LocalTime.parse(normalizeTime(startTimeStr));
                et = LocalTime.parse(normalizeTime(endTimeStr));
            } catch (DateTimeParseException e) {
                return new ApiResult(false, Collections.emptyMap(), "Giờ học không hợp lệ!", 400);
            }
            if (!et.isAfter(st)) {
                return new ApiResult(false, Collections.emptyMap(), "Giờ kết thúc phải sau giờ bắt đầu!", 400);
            }

            Time sqlStart = Time.valueOf(st);
            Time sqlEnd = Time.valueOf(et);

            Connection conn = studentRepository.getConnection();
            conn.setAutoCommit(false);
            try {
                BigDecimal price = classRepository.getPricePerSession(conn, levelId.intValue());
                if (price == null) {
                    conn.rollback();
                    return new ApiResult(false, Collections.emptyMap(), "Cấp độ (level) không tồn tại!", 400);
                }

                if (classRepository.classNameExists(conn, normalizedClassName)) {
                    conn.rollback();
                    return new ApiResult(false, Collections.emptyMap(), "Tên lớp học này đã tồn tại!", 400);
                }

                for (String day : days) {
                    if (classRepository.hasTeacherScheduleOverlap(conn, teacherId.intValue(), day, sqlStart, sqlEnd, null)) {
                        conn.rollback();
                        return new ApiResult(false, Collections.emptyMap(), "Giáo viên đã có lịch trùng vào cùng ngày và khung giờ!", 400);
                    }
                }

                int classId = classRepository.insertClass(conn, normalizedClassName, levelId.intValue(), teacherId.intValue(),
                        Date.valueOf(sd), capacity.intValue(), price);

                for (String day : days) {
                    classRepository.insertSchedule(conn, classId, day, sqlStart, sqlEnd);
                }

                conn.commit();
                Map<String, Object> data = new LinkedHashMap<String, Object>();
                data.put("classId", Integer.valueOf(classId));
                return new ApiResult(true, data, "Tạo lớp thành công", 201);
            } catch (SQLException e) {
                conn.rollback();
                String msg = e.getMessage() != null ? e.getMessage() : "";
                if (msg.contains("Duplicate") || msg.contains("duplicate")) {
                    return new ApiResult(false, Collections.emptyMap(), "Tên lớp học này đã tồn tại!", 400);
                }
                return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
            } finally {
                conn.setAutoCommit(true);
                conn.close();
            }
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    private static String normalizeTime(String t) {
        String s = t.trim();
        if (s.length() == 5 && s.charAt(2) == ':') {
            return s + ":00";
        }
        return s;
    }

    public ApiResult searchClassesForManage(String search) {
        try {
            List<Map<String, Object>> flat = classRepository.searchClassesFlatRows(search);
            List<Map<String, Object>> merged = mergeScheduleRows(flat);
            return new ApiResult(true, merged, "OK", 200);
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> mergeScheduleRows(List<Map<String, Object>> flat) {
        Map<Integer, Map<String, Object>> byClass = new LinkedHashMap<Integer, Map<String, Object>>();
        for (Map<String, Object> r : flat) {
            int id = ((Number) r.get("classId")).intValue();
            if (!byClass.containsKey(Integer.valueOf(id))) {
                Map<String, Object> m = new LinkedHashMap<String, Object>();
                m.put("classId", r.get("classId"));
                m.put("className", r.get("className"));
                m.put("startDate", r.get("startDate"));
                m.put("capacity", r.get("capacity"));
                m.put("currentSize", r.get("currentSize"));
                m.put("teacherName", r.get("teacherName"));
                m.put("levelName", r.get("levelName"));
                m.put("pricePerSession", r.get("pricePerSession"));
                m.put("schedules", new ArrayList<Map<String, Object>>());
                byClass.put(Integer.valueOf(id), m);
            }
            String dow = (String) r.get("dayOfWeek");
            if (dow != null) {
                Map<String, Object> slot = new LinkedHashMap<String, Object>();
                slot.put("dayOfWeek", dow);
                slot.put("startTime", r.get("startTime"));
                slot.put("endTime", r.get("endTime"));
                ((List<Map<String, Object>>) byClass.get(Integer.valueOf(id)).get("schedules")).add(slot);
            }
        }
        return new ArrayList<Map<String, Object>>(byClass.values());
    }

    public ApiResult changeEnrollment(String action, int classId, List<String> studentIds) {
        if (studentIds == null || studentIds.isEmpty()) {
            return new ApiResult(false, Collections.emptyMap(), "Danh sách học sinh không được để trống!", 400);
        }
        String act = action == null ? "" : action.trim().toLowerCase();
        if (!"add".equals(act) && !"remove".equals(act)) {
            return new ApiResult(false, Collections.emptyMap(), "action phải là add hoặc remove!", 400);
        }

        try {
            Connection conn = studentRepository.getConnection();
            conn.setAutoCommit(false);
            try {
                Map<String, Object> summary = classRepository.getClassSummary(conn, classId);
                if (summary == null) {
                    conn.rollback();
                    return new ApiResult(false, Collections.emptyMap(), "Lớp không tồn tại!", 404);
                }

                int cap = ((Number) summary.get("capacity")).intValue();
                int cur = ((Number) summary.get("currentSize")).intValue();

                if ("add".equals(act)) {
                    Set<String> unique = new LinkedHashSet<String>();
                    for (String sid : studentIds) {
                        if (sid != null && !sid.trim().isEmpty()) {
                            unique.add(sid.trim());
                        }
                    }
                    int n = unique.size();
                    if (cur + n > cap) {
                        conn.rollback();
                        return new ApiResult(false, Collections.emptyMap(), "Vượt quá sức chứa lớp!", 400);
                    }
                    for (String sid : unique) {
                        if (!studentRepository.studentExists(conn, sid)) {
                            conn.rollback();
                            return new ApiResult(false, Collections.emptyMap(), "Học sinh không tồn tại: " + sid, 404);
                        }
                        if (!studentRepository.isStudentUnassigned(conn, sid)) {
                            conn.rollback();
                            return new ApiResult(false, Collections.emptyMap(), "Học sinh đã được xếp lớp: " + sid, 409);
                        }
                        if (!studentRepository.updateStudentClassId(conn, sid, Integer.valueOf(classId))) {
                            conn.rollback();
                            return new ApiResult(false, Collections.emptyMap(), "Không thể gán học sinh: " + sid, 500);
                        }
                        if (!classRepository.incrementClassSize(conn, classId)) {
                            conn.rollback();
                            return new ApiResult(false, Collections.emptyMap(), "Vượt quá sức chứa lớp!", 400);
                        }
                    }
                } else {
                    for (String sid : studentIds) {
                        if (sid == null || sid.trim().isEmpty()) {
                            continue;
                        }
                        String id = sid.trim();
                        if (!studentRepository.isStudentInClass(conn, id, classId)) {
                            conn.rollback();
                            return new ApiResult(false, Collections.emptyMap(), "Học sinh không thuộc lớp này: " + id, 400);
                        }
                        if (!studentRepository.updateStudentClassId(conn, id, null)) {
                            conn.rollback();
                            return new ApiResult(false, Collections.emptyMap(), "Không thể xóa học sinh khỏi lớp: " + id, 500);
                        }
                        if (!classRepository.decrementClassSize(conn, classId)) {
                            conn.rollback();
                            return new ApiResult(false, Collections.emptyMap(), "Không thể cập nhật sĩ số lớp!", 500);
                        }
                    }
                }

                conn.commit();
                return new ApiResult(true, Collections.emptyMap(), "Cập nhật xếp lớp thành công", 200);
            } catch (SQLException e) {
                conn.rollback();
                return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
            } finally {
                conn.setAutoCommit(true);
                conn.close();
            }
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
