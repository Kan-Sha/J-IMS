CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50)
);

CREATE TABLE staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    role_id INT,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(20),
    capacity INT
);

CREATE TABLE learning_status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    status_name VARCHAR(30)
);

CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY,
    last_name VARCHAR(50),
    first_name VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(10),
    parent_name VARCHAR(100),
    phone VARCHAR(15),
    email VARCHAR(100),
    address VARCHAR(255),
    class_id INT,
    status_id INT,
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (status_id) REFERENCES learning_status(status_id)
);

INSERT INTO roles (role_name) VALUES ('Giáo viên'), ('Trợ giảng'), ('Admin'), ('Giám đốc');

-- Demo login account for AUT-02 UI integration
-- email: admin@gmail.com
-- password: 123456 (SHA-256)
INSERT INTO staff (full_name, email, password_hash, role_id)
SELECT 'Admin Demo', 'admin@gmail.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', role_id
FROM roles
WHERE role_name = 'Admin';
