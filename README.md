# J-IMS Backend (Java 8 + HttpServer + JDBC)

Backend for **J-IMS (Joy Integrated Management System)**.

## Tech stack
- **Java 8**
- **Maven** (recommended)
- **MySQL + JDBC** (no Spring Boot)
- `com.sun.net.httpserver.HttpServer`

## Project structure

```text
src/main/java/com/jims/backend/
  controller/
  service/
  repository/
  model/
  util/
Script/
  schema.sql
```

## Quick start (TL;DR)
- **One-time setup**: install prerequisites → create DB → import `Script/schema.sql` → (optional) configure env vars
- **Every time you want to run**: `mvn clean compile` then `mvn exec:java`

## One-time setup (configuration)

### 1) Prerequisites (install once)
- **JDK 8** (`java -version`)
- **Maven** (`mvn -version`)
- **MySQL Server** running locally

### 2) Create database + import schema (run once per new machine / fresh DB)

#### Windows PowerShell

```powershell
# create DB (run once)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS jims;"

# import schema + seed data (run once for a fresh DB)
Get-Content Script/schema.sql | mysql -u root -p jims
```

#### macOS / Linux (bash)

```bash
# create DB (run once)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS jims;"

# import schema + seed data (run once for a fresh DB)
mysql -u root -p jims < Script/schema.sql
```

### 3) Environment variables (optional)



Override them with these variables:
- `JIMS_DB_URL`
- `JIMS_DB_USER`
- `JIMS_DB_PASSWORD`
- `JIMS_PORT`

#### Option A — Set for *current terminal only* (you must re-run when you open a new terminal)

Windows PowerShell:

```powershell
$env:JIMS_DB_URL = "jdbc:mysql://localhost:3306/jims?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:JIMS_DB_USER = "root"
$env:JIMS_DB_PASSWORD = "your_password"
$env:JIMS_PORT = "8080"
```

##### Example:

When you set Mysql user is "root" and password is "123456", the backend will be:
- **DB url**: `jdbc:mysql://localhost:3306/jims?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
- **DB user**: `root`
- **DB password**: `123456`
- **Port**: `8080`


macOS / Linux (bash):

```bash
export JIMS_DB_URL='jdbc:mysql://localhost:3306/jims?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC'
export JIMS_DB_USER='root'
export JIMS_DB_PASSWORD='your_password'
export JIMS_PORT='8080'
```

#### Option B — Set persistently (run once per machine/user)

Windows PowerShell:

```powershell
# run once (persists for future terminals)
setx JIMS_DB_URL "jdbc:mysql://localhost:3306/jims?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
setx JIMS_DB_USER "root"
setx JIMS_DB_PASSWORD "your_password"
setx JIMS_PORT "8080"
```

Note: after `setx`, you must open a **new** terminal for the variables to appear.

## Run the application (every time)

### Option A: Maven (recommended)

```bash
# run any time you want to start the backend
mvn clean compile
mvn exec:java
```

Server starts at `http://localhost:8080` by default.

### Option B: Plain `javac/java` (advanced)

Use Maven unless you have a specific reason not to.

## API endpoints (implemented)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/staff` (create staff)
- `POST /api/students` (create student)
- `GET /api/classes` (list classes)

## CORS
- **Allowed origin**: `http://127.0.0.1:5501`

## API response format

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```




## Quick test (curl)

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"123456"}'
```

### Create staff (Admin)

```bash
curl -X POST http://localhost:8080/api/staff \
  -H "Content-Type: application/json" \
  -H "X-Staff-Role: Admin" \
  -d '{"fullName":"Nguyen Van A","email":"example@gmail.com","role":"Teacher"}'
```

### Create student

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
