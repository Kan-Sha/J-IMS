# Phân tích cases backend (Java) cho UI "Tạo tài khoản"

## Cases theo UI
1. **Thiếu họ tên** → `422 VALIDATION_ERROR`, field=`full_name`, message=`Mục này không được để trống!`
2. **Email sai định dạng** → `422 VALIDATION_ERROR`, field=`email`, message=`Định dạng email không hợp lệ!`
3. **Thiếu chức vụ / role không hợp lệ** → `422 VALIDATION_ERROR`, field=`role`
4. **Email đã tồn tại** (so sánh không phân biệt hoa thường) → `409 EMAIL_EXISTS`
5. **Hợp lệ** → `201` trả về `staff_id`, `full_name`, `email`, `role`, `default_password`

## API
- `POST /api/v1/staff`
- `GET /api/v1/staff`

## Mapping DB
- Bảng `staff` dùng cột: `full_name`, `email`, `password_hash`, `role_id`.
- `role_id` lấy từ bảng `roles` bằng `role_name` (`Giáo viên`, `Trợ giảng`, `Admin`).
