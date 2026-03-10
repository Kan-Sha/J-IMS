# J-IMS Backend (Java 8 + HttpServer + JDBC)

Backend for **J-IMS (Joy Integrated Management System)**.

## Tech Stack
- Java 8
- `com.sun.net.httpserver.HttpServer`
- MySQL
- JDBC (no Spring Boot)
- JSON APIs with CORS

## Project Structure

```text
src/main/java/com/jims/backend/
  controller/
  service/
  repository/
  model/
  util/
```

## Implemented Endpoints

- `POST /api/staff` (AUT-01: Create staff account, Admin only)
- `POST /api/auth/login` (AUT-02)
- `POST /api/auth/logout` (AUT-04)
- `POST /api/students` (STU-01: Create student profile)

## 1) Prerequisites

- JDK 8 installed (`java -version`)
- MySQL server running
- Maven installed (recommended)

## 2) Setup Database

1. Create a database, for example `jims`.
2. Import schema:

```bash
mysql -u root -p jims < Script/schema.sql
```

## 3) Configure Environment Variables

Set these variables before running the backend:

```bash
export JIMS_DB_URL='jdbc:mysql://localhost:3306/jims?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC'
export JIMS_DB_USER='root'
export JIMS_DB_PASSWORD='your_password'
export JIMS_PORT='8080'
```

If omitted, defaults are used from `DBConnection` and `Application`.

## 4) Run the Application

### Option A: Maven (recommended)

```bash
mvn clean compile
mvn exec:java
```

### Option B: Plain javac/java

```bash
mkdir -p out
javac -cp "path/to/mysql-connector.jar:path/to/gson.jar" -d out $(find src/main/java -name "*.java")
java -cp "out:path/to/mysql-connector.jar:path/to/gson.jar" com.jims.backend.Application
```

When started, server listens on `http://localhost:8080` by default.

## 5) CORS

Allowed origin:

- `http://127.0.0.1:5501`

## 6) API Response Format

All APIs return:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

## 7) Quick Test with curl

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"123456"}'
```

### Create Staff (Admin)

```bash
curl -X POST http://localhost:8080/api/staff \
  -H "Content-Type: application/json" \
  -H "X-Staff-Role: Admin" \
  -d '{"fullName":"Nguyen Van A","email":"example@gmail.com","role":"Teacher"}'
```

### Create Student

```bash
curl -X POST http://localhost:8080/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Van",
    "lastName":"Nguyen",
    "dob":"2008-10-12",
    "gender":"Male",
    "parentName":"Nguyen Thi B",
    "phone":"0912345678",
    "email":"abc@gmail.com",
    "address":"Ha Noi",
    "classId":2
  }'
```
