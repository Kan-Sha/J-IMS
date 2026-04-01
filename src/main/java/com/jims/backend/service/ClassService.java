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
    private static final int OPE_FIXED_CAPACITY = 15;

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
            if (isBlank(className)) {
                Map<String, String> fe = new LinkedHashMap<String, String>();
                fe.put("className", "Mục này không được để trống!");
                return new ApiResult(false, fe, "Validation failed", 400);
            }
            String classNameTrim = className.trim();
            if (classNameTrim.length() < 2) {
                Map<String, String> fe = new LinkedHashMap<String, String>();
                fe.put("className", "Tên lớp không phù hợp!");
                return new ApiResult(false, fe, "Validation failed", 400);
            }
            boolean hasLetter = classNameTrim.matches(".*[a-zA-Z].*");
            boolean hasNumber = classNameTrim.matches(".*[0-9].*");
            if (!hasLetter || !hasNumber) {
                Map<String, String> fe = new LinkedHashMap<String, String>();
                fe.put("className", "Tên lớp không phù hợp!");
                return new ApiResult(false, fe, "Validation failed", 400);
            }
            if (classNameTrim.matches(".*[^a-zA-Z0-9\\s-].*")) {
                Map<String, String> fe = new LinkedHashMap<String, String>();
                fe.put("className", "Tên lớp học không hợp lệ!");
                return new ApiResult(false, fe, "Validation failed", 400);
            }
            String normalizedClassName = classNameTrim.toUpperCase();
            if (normalizedClassName.length() > 10) {
                Map<String, String> fe = new LinkedHashMap<String, String>();
                fe.put("className", "Tên lớp học cần ít hơn 10 ký tự");
                return new ApiResult(false, fe, "Validation failed", 400);
            }
            if (levelId == null || teacherId == null || isBlank(startDate)
                    || capacity == null || days == null || isBlank(startTimeStr) || isBlank(endTimeStr)) {
                return new ApiResult(false, Collections.emptyMap(), "Thiếu thông tin bắt buộc!", 400);
            }
            // Business rule: fixed max students = 15. Do not trust client input.
            int enforcedCapacity = OPE_FIXED_CAPACITY;
            if (enforcedCapacity < 3 || enforcedCapacity > 18) {
                return new ApiResult(false, Collections.emptyMap(), "Số lượng học sinh không phù hợp!", 400);
            }
            if (days.size() != 2) {
                return new ApiResult(false, Collections.emptyMap(), "Mỗi lớp phải có đúng 2 buổi học trong tuần!", 400);
            }
            Set<String> distinctDays = new LinkedHashSet<String>();
            List<String> canonicalDays = new ArrayList<String>();
            for (String d : days) {
                String canon = normalizeDayOfWeek(d);
                if (canon == null) {
                    return new ApiResult(false, Collections.emptyMap(), "Ngày học không hợp lệ!", 400);
                }
                distinctDays.add(canon.toLowerCase());
                canonicalDays.add(canon);
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
            int startMins = st.getHour() * 60 + st.getMinute();
            int endMins = et.getHour() * 60 + et.getMinute();
            if ((endMins - startMins) < 30) {
                return new ApiResult(false, Collections.emptyMap(), "Thời lượng buổi học phải tối thiểu 30 phút.", 400);
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
                // Only allow 2 levels by tuition snapshot rule (130k / 150k).
                BigDecimal p130 = new BigDecimal("130000.00");
                BigDecimal p150 = new BigDecimal("150000.00");
                if (!(price.compareTo(p130) == 0 || price.compareTo(p150) == 0)) {
                    conn.rollback();
                    return new ApiResult(false, Collections.emptyMap(), "Cấp độ không hợp lệ!", 400);
                }

                if (classRepository.classNameExists(conn, normalizedClassName)) {
                    conn.rollback();
                    return new ApiResult(false, Collections.emptyMap(), "Tên lớp học này đã tồn tại!", 400);
                }

                for (String day : canonicalDays) {
                    if (classRepository.hasTeacherScheduleOverlap(conn, teacherId.intValue(), day, sqlStart, sqlEnd, null)) {
                        conn.rollback();
                        return new ApiResult(false, Collections.emptyMap(), "Giáo viên đã có lịch trùng vào cùng ngày và khung giờ!", 400);
                    }
                }

                int classId = classRepository.insertClass(conn, normalizedClassName, levelId.intValue(), teacherId.intValue(),
                        Date.valueOf(sd), enforcedCapacity, price);

                for (String day : canonicalDays) {
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

    /**
     * Canonical storage format: English day strings (Mon-Sat only).
     * Accepts legacy numeric values (2..7) and common variants; rejects Sunday.
     */
    private static String normalizeDayOfWeek(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        if (s.isEmpty()) return null;
        String lower = s.toLowerCase();
        if ("sunday".equals(lower) || "sun".equals(lower) || "cn".equals(lower) || "chu nhat".equals(lower) || "chủ nhật".equals(lower) || "1".equals(lower) || "0".equals(lower) || "8".equals(lower)) {
            return null;
        }
        if ("2".equals(lower) || "monday".equals(lower) || "mon".equals(lower)) return "Monday";
        if ("3".equals(lower) || "tuesday".equals(lower) || "tue".equals(lower) || "tues".equals(lower)) return "Tuesday";
        if ("4".equals(lower) || "wednesday".equals(lower) || "wed".equals(lower)) return "Wednesday";
        if ("5".equals(lower) || "thursday".equals(lower) || "thu".equals(lower) || "thur".equals(lower) || "thurs".equals(lower)) return "Thursday";
        if ("6".equals(lower) || "friday".equals(lower) || "fri".equals(lower)) return "Friday";
        if ("7".equals(lower) || "saturday".equals(lower) || "sat".equals(lower)) return "Saturday";
        return null;
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

                classRepository.syncCurrentSizeFromStudents(conn, classId);

                int cap = ((Number) summary.get("capacity")).intValue();
                int cur = studentRepository.countStudentsInClass(conn, classId);

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
                        return new ApiResult(false, Collections.emptyMap(), "Số lượng học sinh vượt quá giới hạn sĩ số của lớp!", 400);
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
                            return new ApiResult(false, Collections.emptyMap(), "Số lượng học sinh vượt quá giới hạn sĩ số của lớp!", 400);
                        }
                    }
                    classRepository.syncCurrentSizeFromStudents(conn, classId);
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
                    classRepository.syncCurrentSizeFromStudents(conn, classId);
                }

                conn.commit();
                if ("add".equals(act)) {
                    return new ApiResult(true, Collections.emptyMap(), "Thêm học sinh thành công!", 200);
                }
                return new ApiResult(true, Collections.emptyMap(), "Đã xóa học sinh khỏi lớp!", 200);
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

    /**
     * OPE-03: minimal payload (class name, capacity, students only) for faster load.
     */
    public ApiResult getOpe03ClassPayload(int classId) {
        if (classId <= 0) {
            return new ApiResult(false, Collections.emptyMap(), "classId không hợp lệ!", 400);
        }
        try {
            Connection conn = studentRepository.getConnection();
            try {
                Map<String, Object> basic = classRepository.getClassNameCapacity(conn, classId);
                if (basic == null) {
                    return new ApiResult(false, Collections.emptyMap(), "Lớp không tồn tại!", 404);
                }
                classRepository.syncCurrentSizeFromStudents(conn, classId);
                List<Map<String, Object>> students = classRepository.listStudentsInClass(conn, classId);
                int enrolled = students.size();
                Map<String, Object> data = new LinkedHashMap<String, Object>();
                data.put("classId", basic.get("classId"));
                data.put("className", basic.get("className"));
                data.put("capacity", basic.get("capacity"));
                data.put("currentSize", Integer.valueOf(enrolled));
                data.put("students", students);
                return new ApiResult(true, data, "OK", 200);
            } finally {
                conn.close();
            }
        } catch (SQLException e) {
            return new ApiResult(false, Collections.emptyMap(), "Lỗi hệ thống: " + e.getMessage(), 500);
        }
    }

    public ApiResult getClassDetail(int classId) {
        if (classId <= 0) {
            return new ApiResult(false, Collections.emptyMap(), "classId không hợp lệ!", 400);
        }
        try {
            Connection conn = studentRepository.getConnection();
            try {
                Map<String, Object> info = classRepository.getClassInfo(conn, classId);
                if (info == null) {
                    return new ApiResult(false, Collections.emptyMap(), "Lớp không tồn tại!", 404);
                }
                List<Map<String, Object>> schedules = classRepository.listSchedulesByClassId(conn, classId);
                List<Map<String, Object>> students = classRepository.listStudentsInClass(conn, classId);
                Map<String, Object> data = new LinkedHashMap<String, Object>();
                data.putAll(info);
                data.put("schedules", schedules);
                data.put("students", students);
                return new ApiResult(true, data, "OK", 200);
            } finally {
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
