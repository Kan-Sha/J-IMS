
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
('Khối nhỏ', 120000.00),
('Khối trung', 150000.00),
('Khối lớn', 180000.00);

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

-- Sample teachers (Giáo viên / Trợ giảng) — same default hash for dev
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
('KID-1D', 1, 2, '2025-01-15', 18, 0, 120000.00),
('KID-2G', 1, 2, '2025-02-01', 18, 0, 120000.00),
('KID-3A', 2, 2, '2025-03-01', 18, 0, 150000.00),
('5E1', 3, 2, '2025-09-01', 18, 0, 180000.00);

INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Monday', '08:00:00', '09:30:00' FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;
INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Wednesday', '08:00:00', '09:30:00' FROM classes c WHERE c.class_name = 'KID-1D' LIMIT 1;

INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Tuesday', '14:00:00', '15:30:00' FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;
INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Thursday', '14:00:00', '15:30:00' FROM classes c WHERE c.class_name = 'KID-2G' LIMIT 1;

INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Monday', '10:00:00', '11:30:00' FROM classes c WHERE c.class_name = 'KID-3A' LIMIT 1;
INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Friday', '10:00:00', '11:30:00' FROM classes c WHERE c.class_name = 'KID-3A' LIMIT 1;

INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Saturday', '08:30:00', '10:00:00' FROM classes c WHERE c.class_name = '5E1' LIMIT 1;
INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time)
SELECT c.class_id, 'Friday', '08:30:00', '10:00:00' FROM classes c WHERE c.class_name = '5E1' LIMIT 1;
