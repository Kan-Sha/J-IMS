Dưới đây là **README chuẩn kiểu GitHub project** (gọn, chuyên nghiệp, dễ đọc cho developer khác), giả định **MySQL JDBC Driver đã nằm trong `lib/`**.

---

# J-IMS Backend (Java)

Backend Java thuần cho chức năng **Staff Management – Create Account (AUT-01)** của hệ thống **J-IMS (Joy English Institute Management System)**.

Hệ thống cung cấp REST API để:

* Tạo tài khoản nhân viên
* Lấy danh sách nhân viên
* Lưu dữ liệu vào MySQL theo schema đã cung cấp

---

# Tech Stack

```
Java (JDK 8+)
MySQL 8+
JDBC
REST API (HTTP)
```

Project **không sử dụng framework** (Spring, Maven, Gradle) để giữ code đơn giản và minh họa rõ logic backend.

---

# Project Structure

```
J-IMS
│
├── docs/                # tài liệu UI / requirement
├── scripts/             # database schema
│   └── schema.sql
│
├── lib/                 # external libraries
│   └── mysql-connector-j-8.x.x.jar
│
├── src/
│   ├── main/java/com/jims/backend
│   │
│   │   ├── controller   # xử lý HTTP request
│   │   ├── service      # business logic
│   │   ├── repository   # database access
│   │   ├── model        # entity / DTO
│   │   └── Application  # entry point
│   │
│   └── test/java
│       └── StaffServiceTest
│
└── README.md
```

---

# Setup

## 1. Yêu cầu hệ thống

Cài đặt:

```
Java JDK 8+
MySQL Server
```

Kiểm tra:

```bash
java -version
mysql --version
```

---

# Database Setup

Tạo database:

```sql
CREATE DATABASE jims;
```

Import schema:

```bash
mysql -u root -p jims < scripts/schema.sql
```

Kiểm tra bảng:

```sql
USE jims;
SHOW TABLES;
```

Các bảng cần có:

```
roles
staff
students
classes
learning_status
```

Kiểm tra roles seed:

```sql
SELECT * FROM roles;
```

Ví dụ:

```
+---------+---------------+
| role_id | role_name     |
+---------+---------------+
| 1       | Giáo viên     |
| 2       | Trợ giảng     |
| 3       | Admin         |
```

---

# Configuration

Thiết lập biến môi trường:

```bash
export DB_URL='jdbc:mysql://127.0.0.1:3306/jims'
export DB_USER='root'
export DB_PASSWORD='your_password'
```

Ví dụ:

```bash
export DB_PASSWORD='123456'
```

---

# Build Project

Compile toàn bộ source:

```bash
javac -cp "lib/mysql-connector-j-8.3.0.jar" -d out $(find src/main/java -name "*.java")
```

Sau khi compile:

```
out/
```

sẽ chứa các `.class`.

---

# Run Server

```bash
java -cp "out:lib/mysql-connector-j-8.3.0.jar" com.jims.backend.Application
```

Server sẽ chạy tại:

```
http://localhost:8080
```

---

# API

## Create Staff

```
POST /api/v1/staff
```

Request:

```json
{
  "full_name": "Nguyen Van A",
  "email": "admin@example.com",
  "password": "123456",
  "role": "Admin"
}
```

Test bằng curl:

```bash
curl -X POST http://localhost:8080/api/v1/staff \
-H "Content-Type: application/json" \
-d '{
"full_name":"Nguyen Van A",
"email":"admin@example.com",
"password":"123456",
"role":"Admin"
}'
```

Response:

```json
{
  "staff_id": 1,
  "full_name": "Nguyen Van A",
  "email": "admin@example.com",
  "role": "Admin",
  "default_password": "JoyEnglish@123"
}
```

---

## Get Staff List

```
GET /api/v1/staff
```

Test:

```bash
curl http://localhost:8080/api/v1/staff
```

Response:

```json
[
  {
    "staffId": 1,
    "fullName": "Nguyen Van A",
    "email": "admin@example.com",
    "role": "Admin"
  }
]
```

---

# Running Tests

Test service layer (không cần database):

```bash
javac -d out $(find src/main/java src/test/java -name "*.java")
java -cp out com.jims.backend.StaffServiceTest
```

---

# Common Issues

### DB_ERROR khi gọi API

Nguyên nhân phổ biến:

```
MySQL chưa chạy
Sai DB_PASSWORD
Database chưa import schema
```

Kiểm tra MySQL:

```bash
sudo systemctl status mysql
```

---

### Server chạy nhưng API trả []

Điều này **không phải lỗi**.
Chỉ có nghĩa là bảng `staff` chưa có dữ liệu.

---

# Development Workflow

```
1. Setup database
2. Compile project
3. Run backend
4. Test API bằng curl
```

---

# Git Notes

Không commit file build:

```
out/
*.class
```

Thêm `.gitignore`:

```
out/
*.class
```

---

# License

Internal academic project for **Joy English Institute Management System**.

