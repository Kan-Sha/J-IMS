

# J-IMS 
hệ thống **J-IMS (Joy English Institute Management System)**.

Hiện tại backend hỗ trợ các chức năng:

* **AUT-01:** Create Staff Account
* **AUT-02:** Staff Login
* **Staff Management API**

Hệ thống cung cấp REST API để:

* Tạo tài khoản nhân viên
* Đăng nhập hệ thống
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
├── docs/                      # tài liệu integration / requirement
│   └── aut02-integration.md
│
├── scripts/                   # database schema
│   └── schema.sql
│
├── UI/
│   └── AUT02/                 # login UI prototype
│       ├── aut02.html
│       ├── aut02.css
│       ├── aut02.js
│       └── images
│
├── lib/                       # external libraries
│   └── mysql-connector-j-8.x.x.jar
│
├── src/
│   ├── main/java/com/jims/backend
│   │
│   │   ├── http               # HTTP handlers
│   │   │   ├── AuthHandler
│   │   │   └── StaffHandler
│   │   │
│   │   ├── service            # business logic
│   │   │   └── AuthService
│   │   │
│   │   ├── repository         # database access
│   │   │   └── JdbcStaffRepository
│   │   │
│   │   ├── dto                # request / response objects
│   │   │   ├── LoginRequest
│   │   │   └── LoginResponse
│   │   │
│   │   ├── model              # entities
│   │   │   └── Role
│   │   │
│   │   ├── util               # utility classes
│   │   │   ├── JsonUtil
│   │   │   └── HttpUtil
│   │   │
│   │   └── Application        # entry point
│   │
│   └── test/java
│       ├── StaffServiceTest
│       └── AuthServiceTest
│
└── README.md
```

---

# Setup

## 1. System Requirements

Install:

```
Java JDK 8+
MySQL Server
```

Check:

```bash
java -version
mysql --version
```

---

# Database Setup

Create database:

```sql
CREATE DATABASE jims;
```

Import schema:

```bash
mysql -u root -p jims < scripts/schema.sql
```

Check tables:

```sql
USE jims;
SHOW TABLES;
```

Expected tables:

```
roles
staff
students
classes
learning_status
```

Check roles seed:

```sql
SELECT * FROM roles;
```

Example:

```
role_id | role_name
1       | Giáo viên
2       | Trợ giảng
3       | Admin
4       | Giám đốc
```

---

# Configuration

Set environment variables:

```bash
export DB_URL='jdbc:mysql://127.0.0.1:3306/jims'
export DB_USER='root'
export DB_PASSWORD='your_password'
```

Example:

```bash
export DB_PASSWORD='123456'
```

---

# Build Project

Compile all source files:

```bash
javac -cp "lib/mysql-connector-j-8.3.0.jar" -d out $(find src/main/java -name "*.java")
```

After compiling, the compiled classes will appear in:

```
out/
```

---

# Run Server

```bash
java -cp "out:lib/mysql-connector-j-8.3.0.jar" com.jims.backend.Application
```

Server will run at:

```
http://localhost:8080
```

---

# API

## Create Staff (AUT-01)

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

Example test:

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

# Login (AUT-02)

```
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "admin@example.com",
  "password": "JoyEnglish@123"
}
```

Success response:

```json
{
  "staff_id": 1,
  "full_name": "Nguyen Van A",
  "email": "admin@example.com",
  "role": "Admin",
  "redirect_to": "/admin/dashboard"
}
```

Possible errors:

```
422 VALIDATION_ERROR
"Mục này không được để trống!"

422 VALIDATION_ERROR
"Định dạng email không hợp lệ!"

401 AUTH_FAILED
"Email hoặc mật khẩu không chính xác!"
```

---

# Get Staff List

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

# UI Prototype (AUT-02)

Login UI prototype nằm tại:


UI/AUT02/aut02.html


Chạy bằng cách mở file:


UI/AUT02/aut02.html


Chi tiết cách kết nối UI với backend:


docs/aut02-integration.md


---

# Running Tests

Run service layer tests:

```bash
javac -d out $(find src/main/java src/test/java -name "*.java")
java -cp out com.jims.backend.StaffServiceTest
```

Run login service test:

```bash
java -cp out com.jims.backend.AuthServiceTest
```

---

