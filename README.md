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

# import schema + seed data (run for a fresh DB)
cmd /c "mysql -u root -p jims < Script/schema.sql"
```



### 3) Environment variables (optional)


#### Set for *current terminal only* (you must re-run when you open a new terminal)

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

which means:
```powershell
$env:JIMS_DB_URL = "jdbc:mysql://localhost:3306/jims?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:JIMS_DB_USER = "root"
$env:JIMS_DB_PASSWORD = "123456"
$env:JIMS_PORT = "8080"
```

## Run the application (every time)
### Use Maven 

```bash
# run any time you want to start the backend
mvn clean compile
mvn exec:java
```
It will show:
Server starts at `http://localhost:8080` by default.

