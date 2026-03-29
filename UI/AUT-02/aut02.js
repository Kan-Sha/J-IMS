document.addEventListener('DOMContentLoaded', function() {

  const inputMatKhau  = document.getElementById('mat-khau');
  const iconMat       = document.getElementById('icon-mat');
  const nutDangNhap   = document.getElementById('nut-dang-nhap');
  const nutToggleMK   = document.getElementById('nut-toggle-mk');
  const thongBao      = document.getElementById('thong-bao');

  const khungEmail    = document.getElementById('khung-email');
  const khungMatKhau  = document.getElementById('khung-matkhau');
  const loiEmail      = document.getElementById('loi-email');
  const loiMatKhau    = document.getElementById('loi-matkhau');

  let dangHienMatKhau = false;
  const API_BASE = 'http://127.0.0.1:8080';
  const EMAIL_REGEX_COM = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/;


  function hienLoiInput(khung, loiEl, noiDung) {
    khung.classList.add('loi-input');     
    loiEl.textContent = noiDung;          
    loiEl.classList.add('hien');          
    const input = khung.querySelector('.o-nhap');
  if (input && input.type === 'password') {
    input.setAttribute('placeholder', '');  
  }
  }

  function xoaLoiInput(khung, loiEl) {
    khung.classList.remove('loi-input');
    loiEl.textContent = '';
    loiEl.classList.remove('hien');
    const input = khung.querySelector('.o-nhap');
  if (input && input.type === 'password') {
    input.setAttribute('placeholder', '***************');
  }
  }

  document.getElementById('email').addEventListener('input', function() {
    xoaLoiInput(khungEmail, loiEmail);
  });

  document.getElementById('mat-khau').addEventListener('input', function() {
    xoaLoiInput(khungMatKhau, loiMatKhau);
  });

  nutToggleMK.addEventListener('click', function() {
    dangHienMatKhau = !dangHienMatKhau;
    if (dangHienMatKhau) {
      inputMatKhau.type = 'text';
      iconMat.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
    } else {
      inputMatKhau.type = 'password';
      iconMat.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      `;
    }
  });

  nutDangNhap.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const rect = nutDangNhap.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width  = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.left   = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top    = (e.clientY - rect.top  - size / 2) + 'px';
    nutDangNhap.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    xuLyDangNhap();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') xuLyDangNhap();
  });

  function showThongBao(type, message) {
    thongBao.style.display = 'flex';
    thongBao.className = 'thong-bao';
    if (type === 'success') thongBao.classList.add('thanh-cong');
    if (type === 'error') thongBao.classList.add('loi');
    thongBao.textContent = message || '';
  }

  async function xuLyDangNhap() {
    const email   = document.getElementById('email').value.trim();
    const matKhau = document.getElementById('mat-khau').value;
    xoaLoiInput(khungEmail, loiEmail);
    xoaLoiInput(khungMatKhau, loiMatKhau);
    thongBao.style.display = 'none';
    thongBao.className = 'thong-bao';

    let coLoi = false;

    if (!email) {
      hienLoiInput(khungEmail, loiEmail, 'Mục này không được để trống!');
      coLoi = true;
    } else if (!EMAIL_REGEX_COM.test(email)) {
      hienLoiInput(khungEmail, loiEmail, 'Định dạng email không hợp lệ!');
      coLoi = true;
    }

    if (!matKhau) {
      hienLoiInput(khungMatKhau, loiMatKhau, 'Mục này không được để trống!');
      coLoi = true;
    }

    if (coLoi) return; // chặn hoàn toàn việc gọi API khi email không hợp lệ

    nutDangNhap.textContent = 'Đang xử lý...';
    nutDangNhap.disabled    = true;

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password: matKhau })
      });

      const payload = await res.json().catch(() => null);
      const success = !!(payload && payload.success);
      const message = payload && payload.message ? payload.message : 'Đăng nhập thất bại!';

      if (!success) {
        // Chỉ hiển thị thông báo lỗi chung phía trên, đánh dấu khung nhập màu đỏ
        khungEmail.classList.add('loi-input');
        khungMatKhau.classList.add('loi-input');
        showThongBao('error', message);
        return;
      }

      showThongBao('success', '✅ Đăng nhập thành công!');

      const token = payload && payload.data && payload.data.token ? String(payload.data.token) : null;
      if (token) {
        localStorage.setItem('JIMS_TOKEN', token);
      }

      const data = payload && payload.data ? payload.data : {};
      const staffId = data.staffId != null ? String(data.staffId) : null;
      const role = data.role != null ? String(data.role) : '';
      const setupKey = staffId ? 'JIMS_SETUP_DONE_' + staffId : null;

      if (setupKey && !localStorage.getItem(setupKey)) {
        window.location.href = '../AUT-03/aut03.html';
        return;
      }

      const redirect = data.redirect ? String(data.redirect) : null;
      if (redirect) {
        let target = redirect;
        target = target
          .replace(/^\/AUT01\//, '/UI/AUT-01/')
          .replace(/^\/AUT02\//, '/UI/AUT-02/')
          .replace(/^\/STU01-03\//, '/UI/STU-01/');
        window.location.href = target;
        return;
      }

      if (role && role.toLowerCase() === 'admin') {
        window.location.href = '../AUT-01/aut01.html';
      } else {
        window.location.href = '../STU-03/stu03.html';
      }
    } catch (err) {
      showThongBao('error', 'Không thể kết nối server. Hãy kiểm tra backend đang chạy.');
    } finally {
      nutDangNhap.textContent = 'Đăng nhập';
      nutDangNhap.disabled = false;
    }
  }

});