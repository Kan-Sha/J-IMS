# J-IMS Java Backend

Backend Java thuần cho màn hình **Quản lý nhân viên > Tạo tài khoản**, có validate theo UI và lưu vào DB theo schema đã cung cấp.

## 1) Chuẩn bị database
Chạy schema:
```bash
mysql -u root -p jims < scripts/schema.sql
```

## 2) Chạy server
```bash
export DB_URL='jdbc:mysql://localhost:3306/jims'
export DB_USER='root'
export DB_PASSWORD='your_password'

javac -d out $(find src/main/java -name '*.java')
java -cp out com.jims.backend.Application
```

## 3) API
### Tạo staff
```bash
curl -X POST http://localhost:8080/api/v1/staff \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"Nguyễn Văn A","email":"a@gmail.com","role":"Giáo viên"}'
```

### Danh sách staff
```bash
curl http://localhost:8080/api/v1/staff
```

## 4) Chạy test service (không cần DB)
```bash
javac -d out $(find src/main/java src/test/java -name '*.java')
java -cp out com.jims.backend.StaffServiceTest
```
