
-- J-IMS Database Schema — relationships, integrity, business rules (AUT / OPE / FIN)
-- MySQL 8.0+ recommended (CHECK constraints, triggers)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS invoice_details;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS class_schedule;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS levels;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS learning_status;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (role_name) VALUES
('Admin'),
('Giáo viên'),
('Trợ giảng');

CREATE TABLE staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE levels (
    level_id INT AUTO_INCREMENT PRIMARY KEY,
    level_name VARCHAR(50) NOT NULL UNIQUE,
    price_per_session DECIMAL(12, 2) NOT NULL
);

INSERT INTO levels (level_name, price_per_session) VALUES
('Cơ bản', 130000.00),
('Nâng cao', 150000.00);

CREATE TABLE classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    level_id INT NOT NULL,
    teacher_id INT NOT NULL,
    start_date DATE NOT NULL,
    capacity INT NOT NULL,
    current_size INT NOT NULL DEFAULT 0,
    tuition_per_session DECIMAL(12, 2) NOT NULL,
    CONSTRAINT uq_classes_class_name UNIQUE (class_name),
    CONSTRAINT chk_classes_capacity CHECK (capacity >= 3 AND capacity <= 18),
    CONSTRAINT chk_classes_current_size CHECK (current_size >= 0),
    FOREIGN KEY (level_id) REFERENCES levels(level_id),
    FOREIGN KEY (teacher_id) REFERENCES staff(staff_id)
);

CREATE TABLE class_schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT chk_schedule_time_order CHECK (end_time > start_time),
    CONSTRAINT chk_schedule_day_of_week CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE
);

DELIMITER //
CREATE TRIGGER tr_class_schedule_max_two
BEFORE INSERT ON class_schedule
FOR EACH ROW
BEGIN
    DECLARE schedule_count INT;
    SELECT COUNT(*) INTO schedule_count FROM class_schedule WHERE class_id = NEW.class_id;
    IF schedule_count >= 2 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mỗi lớp chỉ được tối đa 2 buổi học trong lịch';
    END IF;
END//
DELIMITER ;

CREATE TABLE learning_status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    status_name VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO learning_status (status_name) VALUES
('Đang học'),
('Nghỉ học');

CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    parent_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    address VARCHAR(255),
    class_id INT NULL,
    status_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (status_id) REFERENCES learning_status(status_id),
    UNIQUE (first_name, last_name, date_of_birth, phone)
);

CREATE TABLE invoices (
    invoice_id VARCHAR(32) NOT NULL PRIMARY KEY,
    class_id INT NOT NULL,
    billing_period VARCHAR(7) NOT NULL,
    total_sessions INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_invoice_class_period UNIQUE (class_id, billing_period),
    CONSTRAINT chk_invoice_sessions CHECK (total_sessions > 0),
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

CREATE TABLE invoice_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id VARCHAR(32) NOT NULL,
    student_id VARCHAR(20) NOT NULL,
    base_fee DECIMAL(12, 2) NOT NULL,
    final_fee DECIMAL(12, 2) NOT NULL,
    adjustment_reason VARCHAR(500) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    CONSTRAINT chk_invoice_detail_adjustment CHECK (
        base_fee = final_fee
        OR (adjustment_reason IS NOT NULL AND CHAR_LENGTH(TRIM(adjustment_reason)) > 0)
    ),
    CONSTRAINT chk_invoice_detail_max_fee CHECK (final_fee >= 0 AND final_fee <= 9999999.00),
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    UNIQUE KEY uq_invoice_student (invoice_id, student_id)
);

-- Default admin (password: 123456 → SHA-256 as in legacy seed)
INSERT INTO staff (full_name, email, password_hash, role_id)
SELECT 'Admin Demo',
       'admin@gmail.com',
       '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
       role_id
FROM roles WHERE role_name = 'Admin' LIMIT 1;

-- Sample teachers (Giáo viên / Trợ giảng) — same password: 123456
INSERT INTO staff (full_name, email, password_hash, role_id)
SELECT 'Giáo viên Demo', 'teacher@gmail.com',
       '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
       role_id FROM roles WHERE role_name = 'Giáo viên' LIMIT 1;

INSERT INTO staff (full_name, email, password_hash, role_id)
SELECT 'Trợ giảng Demo', 'ta@gmail.com',
       '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
       role_id FROM roles WHERE role_name = 'Trợ giảng' LIMIT 1;

-- Seed classes (admin staff_id=1; first Giáo viên staff_id=2)
INSERT INTO classes (class_name, level_id, teacher_id, start_date, capacity, current_size, tuition_per_session) VALUES
('KID-1D', 1, 2, '2025-03-01', 12, 0, 130000.00),
('KID-2G', 1, 2, '2025-03-15', 12, 0, 130000.00),
('ADV-1A', 2, 2, '2025-04-01', 12, 0, 150000.00);


INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Monday', '18:00:00', '19:30:00' FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;
INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Wednesday', '18:00:00', '19:30:00' FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;

INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Tuesday', '18:00:00', '19:30:00' FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;
INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Thursday', '18:00:00', '19:30:00' FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;

INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Friday', '18:00:00', '19:30:00' FROM classes c WHERE c.class_name = 'ADV-1A' LIMIT 1;
INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Saturday', '08:30:00', '10:00:00' FROM classes c WHERE c.class_name = 'ADV-1A' LIMIT 1;

-- Demo students with new ID format JS-YYYYMM-XXX
INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202503-001', 'Minh Anh', 'Nguyễn', '2015-03-12', 'Nam', 'Nguyễn Văn A', '0901000001', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202503-002', 'Thu Trang', 'Trần', '2015-05-21', 'Nữ', 'Trần Văn B', '0901000002', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202503-003', 'Quang Huy', 'Lê', '2015-07-10', 'Nam', 'Lê Văn C', '0901000003', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202503-004', 'Bảo Ngọc', 'Phạm', '2015-09-05', 'Nữ', 'Phạm Văn D', '0901000004', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202503-005', 'Hoàng Nam', 'Đỗ', '2015-11-18', 'Nam', 'Đỗ Văn E', '0901000005', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202503-006', 'Khánh Linh', 'Ngô', '2015-02-09', 'Nữ', 'Ngô Văn F', '0901000006', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202503-007', 'Tuấn Kiệt', 'Vũ', '2015-06-03', 'Nam', 'Vũ Văn G', '0901000007', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202503-008', 'Mai Anh', 'Đinh', '2015-01-25', 'Nữ', 'Đinh Văn H', '0901000008', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202503-009', 'Anh Tuấn', 'Bùi', '2015-04-30', 'Nam', 'Bùi Văn K', '0901000009', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202503-010', 'Thu Hà', 'Hoàng', '2015-08-14', 'Nữ', 'Hoàng Văn L', '0901000010', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;

-- KID-2G: 10 students
INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202504-001', 'Gia Huy', 'Nguyễn', '2014-03-02', 'Nam', 'Nguyễn Văn M', '0902000001', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202504-002', 'Lan Anh', 'Trần', '2014-05-15', 'Nữ', 'Trần Văn N', '0902000002', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202504-003', 'Đức Anh', 'Lê', '2014-07-19', 'Nam', 'Lê Văn P', '0902000003', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202504-004', 'Bích Ngọc', 'Phạm', '2014-09-23', 'Nữ', 'Phạm Văn Q', '0902000004', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202504-005', 'Minh Quân', 'Đỗ', '2014-11-07', 'Nam', 'Đỗ Văn R', '0902000005', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202504-006', 'Khánh An', 'Ngô', '2014-02-28', 'Nữ', 'Ngô Văn S', '0902000006', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202504-007', 'Anh Khoa', 'Vũ', '2014-04-11', 'Nam', 'Vũ Văn T', '0902000007', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202504-008', 'Diệu Linh', 'Đinh', '2014-06-05', 'Nữ', 'Đinh Văn U', '0902000008', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202504-009', 'Mạnh Dũng', 'Bùi', '2014-08-28', 'Nam', 'Bùi Văn V', '0902000009', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202504-010', 'Quỳnh Chi', 'Hoàng', '2014-10-16', 'Nữ', 'Hoàng Văn X', '0902000010', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;

-- ADV-1A: 10 students
INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202505-001', 'Hồng Sơn', 'Nguyễn', '2013-03-08', 'Nam', 'Nguyễn Văn Y', '0903000001', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'ADV-1A' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202505-002', 'Thanh Thảo', 'Trần', '2013-05-19', 'Nữ', 'Trần Văn Z', '0903000002', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'ADV-1A' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202505-003', 'Anh Dũng', 'Lê', '2013-07-22', 'Nam', 'Lê Văn A1', '0903000003', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'ADV-1A' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202505-004', 'Bảo Châu', 'Phạm', '2013-09-30', 'Nữ', 'Phạm Văn B1', '0903000004', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'ADV-1A' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202505-005', 'Quốc Huy', 'Đỗ', '2013-11-11', 'Nam', 'Đỗ Văn C1', '0903000005', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'ADV-1A' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202505-006', 'Khánh Vy', 'Ngô', '2013-02-17', 'Nữ', 'Ngô Văn D1', '0903000006', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'ADV-1A' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202505-007', 'Anh Khoa', 'Vũ', '2013-04-25', 'Nam', 'Vũ Văn E1', '0903000007', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'ADV-1A' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202505-008', 'Diễm My', 'Đinh', '2013-06-09', 'Nữ', 'Đinh Văn F1', '0903000008', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'ADV-1A' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202505-009', 'Đức Minh', 'Bùi', '2013-08-02', 'Nam', 'Bùi Văn G1', '0903000009', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'ADV-1A' LIMIT 1;

INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, parent_name, phone, email, address, class_id, status_id)
SELECT 'JS-202505-010', 'Thu Uyên', 'Hoàng', '2013-10-20', 'Nữ', 'Hoàng Văn H1', '0903000010', NULL, 'Hà Nội',
       c.class_id, (SELECT status_id FROM learning_status WHERE status_name = 'Đang học' LIMIT 1)
FROM classes c WHERE c.class_name = 'ADV-1A' LIMIT 1;
