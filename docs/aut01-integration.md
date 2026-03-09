# AUT-01 integration (UI `aut01.js` <-> backend)

## API for create staff
- Endpoint: `POST /api/v1/staff`
- Content-Type: `application/json`

Request body expected by backend:
```json
{
  "full_name": "Nguyen Van A",
  "email": "newuser@gmail.com",
  "password": "123456",
  "role": "giao-vien"
}
```

`role` supports both UI labels and AUT01 slug values:
- `Giáo viên` or `giao-vien`
- `Trợ giảng` or `tro-giang`
- `Admin` or `admin`
- `Giám đốc` or `giam-doc`

## Success response
```json
{
  "staff_id": 10,
  "full_name": "Nguyen Van A",
  "email": "newuser@gmail.com",
  "role": "Giáo viên",
  "default_password": "123456"
}
```

When UI gets this response, show success notice like:
- `✅ Tạo tài khoản thành công!`

And then AUT-02 can log in using:
- Email: `newuser@gmail.com`
- Password: `123456`

## Error mapping for AUT01 UI
- `422 VALIDATION_ERROR + field=full_name` -> `Mục này không được để trống!`
- `422 VALIDATION_ERROR + field=email` ->
  - `Mục này không được để trống!`
  - `Định dạng email không hợp lệ!`
- `422 VALIDATION_ERROR + field=password` ->
  - `Mục này không được để trống!`
  - `Mật khẩu phải có ít nhất 6 ký tự!`
- `422 VALIDATION_ERROR + field=role` -> `Mục này không được để trống!`
- `409 EMAIL_EXISTS + field=email` -> `Email này đã tồn tại!`

## Suggested AUT01 `nutLuu` submit flow
Replace `setTimeout(...)` fake save in `aut01.js` with a real API call:

```javascript
const roleMap = {
  'giao-vien': 'giao-vien',
  'tro-giang': 'tro-giang',
  'admin': 'admin'
};

const resp = await fetch('http://localhost:8080/api/v1/staff', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    full_name: hoTen,
    email: email,
    password: matKhau,
    role: roleMap[chucVu] || chucVu
  })
});

const data = await resp.json();
if (resp.ok) {
  thongBao.innerHTML = '✅ Tạo tài khoản thành công!';
  // data.email + data.default_password can be used for AUT-02 login
} else {
  // map data.field + data.message to UI inline errors
}
```
