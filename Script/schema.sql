
-- J-IMS Database Schema (Aligned with User Stories AUT-01 → AUT-05)
-- Removed role: Director
-- Includes constraints, validations, and supporting tables

DROP TABLE IF EXISTS tuition_invoices;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS learning_status;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS roles;

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
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    current_size INT DEFAULT 0
);


INSERT INTO classes (class_name, capacity, current_size)
VALUES
('KID-1D', 30, 0),
('KID-2G', 30, 0),
('KID-3A', 30, 0),
('KID-3D', 30, 0),
('KID-3E', 30, 0),
('KID-3F', 30, 0),
('KID-3M', 30, 0),
('KID-3N', 30, 0),
('KID-4B', 30, 0),
('KID-4C', 30, 0),
('KID-4F', 30, 0),
('KID-4G', 30, 0),
('KID-4H', 30, 0),
('KID-4M', 30, 0),
('KID-5A', 30, 0),
('KID-5C', 30, 0),
('KID-5D', 30, 0),
('KID-5E', 30, 0),
('KID-5H', 30, 0),
('KID-5M', 30, 0),
('KID-5N', 30, 0),
('KID-5Q', 30, 0),
('KID-5R', 30, 0),
('KID-5T', 30, 0),
('5E1', 30, 0),
('5E2', 30, 0),
('5E3', 30, 0),
('5E4', 30, 0),
('5E6', 30, 0),
('6E1', 30, 0),
('6E2', 30, 0),
('6E3', 30, 0),
('6E5', 30, 0),
('7E1', 30, 0),
('7E2', 30, 0),
('7E3', 30, 0),
('7E4', 30, 0),
('7E5', 30, 0),
('7E6', 30, 0),
('8E1', 30, 0),
('8E2', 30, 0),
('8E3', 30, 0),
('8E5', 30, 0),
('8E6', 30, 0),
('9E1', 30, 0),
('9E2', 30, 0),
('9E3', 30, 0),
('9E4', 30, 0),
('5CC1', 30, 0),
('5CC2', 30, 0),
('6CC1', 30, 0),
('6CC2', 30, 0),
('7CC1', 30, 0),
('8CC1', 30, 0),
('TN3', 30, 0),
('TN4', 30, 0),
('TN5', 30, 0),
('TN7', 30, 0),
('TN8', 30, 0);

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
    UNIQUE(first_name, last_name, date_of_birth, phone)
);


INSERT INTO staff (full_name, email, password_hash, role_id)
SELECT 'Admin Demo',
       'admin@gmail.com',
       '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
       role_id
FROM roles
WHERE role_name = 'Admin';
