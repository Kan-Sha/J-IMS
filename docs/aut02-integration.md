# AUT-02 integration (UI `aut02.js` <-> backend)

## Backend endpoint
- `POST /api/v1/auth/login`
- Content-Type: `application/json`

Request body:
```json
{
  "email": "admin@gmail.com",
  "password": "123456"
}
```

Success response (`200`):
```json
{
  "staff_id": 1,
  "full_name": "Admin Demo",
  "email": "admin@gmail.com",
  "role": "Admin",
  "redirect_to": "/admin/dashboard"
}
```

Error response format:
```json
{
  "code": "VALIDATION_ERROR|AUTH_FAILED|DB_ERROR",
  "message": "...",
  "field": "email|password|null"
}
```

## Suggested update for `aut02.js`
Replace the current hardcoded `setTimeout` login block by calling backend:

```javascript
async function xuLyDangNhap() {
  const email = document.getElementById('email').value.trim();
  const matKhau = document.getElementById('mat-khau').value;

  xoaLoiInput(khungEmail, loiEmail);
  xoaLoiInput(khungMatKhau, loiMatKhau);

  let coLoi = false;
  if (!email) {
    hienLoiInput(khungEmail, loiEmail, 'Mục này không được để trống!');
    coLoi = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    hienLoiInput(khungEmail, loiEmail, 'Định dạng email không hợp lệ!');
    coLoi = true;
  }

  if (!matKhau) {
    hienLoiInput(khungMatKhau, loiMatKhau, 'Mục này không được để trống!');
    coLoi = true;
  }

  if (coLoi) return;

  nutDangNhap.textContent = 'Đang xử lý...';
  nutDangNhap.disabled = true;

  try {
    const resp = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: matKhau })
    });

    const data = await resp.json();

    if (resp.ok) {
      window.location.href = data.redirect_to;
      return;
    }

    if (resp.status === 422 && data.field === 'email') {
      hienLoiInput(khungEmail, loiEmail, data.message);
    } else if (resp.status === 422 && data.field === 'password') {
      hienLoiInput(khungMatKhau, loiMatKhau, data.message);
    } else {
      hienLoiInput(khungMatKhau, loiMatKhau, data.message || 'Đăng nhập thất bại!');
    }
  } catch (e) {
    hienLoiInput(khungMatKhau, loiMatKhau, 'Không thể kết nối máy chủ!');
  } finally {
    nutDangNhap.textContent = 'Đăng nhập';
    nutDangNhap.disabled = false;
  }
}
```

## Notes
- Backend now returns CORS headers so the static page can call API from another origin.
- For quick demo, DB seed includes `admin@gmail.com / 123456`.
