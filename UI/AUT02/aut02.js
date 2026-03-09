document.addEventListener('DOMContentLoaded', function () {

  const API_BASE_URL = 'http://localhost:8080';
  const DASHBOARD_URL = '/';

  const inputEmail = document.getElementById('email');
  const inputMatKhau = document.getElementById('mat-khau');
  const iconMat = document.getElementById('icon-mat');
  const nutDangNhap = document.getElementById('nut-dang-nhap');
  const nutToggleMK = document.getElementById('nut-toggle-mk');
  const thongBao = document.getElementById('thong-bao');

  const khungEmail = document.getElementById('khung-email');
  const khungMatKhau = document.getElementById('khung-matkhau');
  const loiEmail = document.getElementById('loi-email');
  const loiMatKhau = document.getElementById('loi-matkhau');

  let dangHienMatKhau = false;

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

  function xoaThongBao() {
    thongBao.style.display = 'none';
    thongBao.textContent = '';
    thongBao.className = 'thong-bao';
  }

  function hienThongBaoLoi(noiDung) {
    thongBao.textContent = noiDung;
    thongBao.className = 'thong-bao loi';
    thongBao.style.display = 'block';
  }

  inputEmail.addEventListener('input', function () {
    xoaLoiInput(khungEmail, loiEmail);
    xoaThongBao();
  });

  inputMatKhau.addEventListener('input', function () {
    xoaLoiInput(khungMatKhau, loiMatKhau);
    xoaThongBao();
  });

  nutToggleMK.addEventListener('click', function () {
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

  nutDangNhap.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const rect = nutDangNhap.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    nutDangNhap.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    xuLyDangNhap();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') xuLyDangNhap();
  });

  async function xuLyDangNhap() {
    if (nutDangNhap.disabled) return;

    const email = inputEmail.value.trim();
    const matKhau = inputMatKhau.value;

    xoaLoiInput(khungEmail, loiEmail);
    xoaLoiInput(khungMatKhau, loiMatKhau);
    xoaThongBao();

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
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password: matKhau
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || 'Email hoặc mật khẩu không chính xác!';
        throw new Error(errorMessage);
      }

      window.location.href = data?.redirectUrl || DASHBOARD_URL;
    } catch (error) {
      hienThongBaoLoi(error.message || 'Không thể đăng nhập. Vui lòng thử lại!');
      hienLoiInput(khungEmail, loiEmail, '');
      hienLoiInput(khungMatKhau, loiMatKhau, 'Email hoặc mật khẩu không chính xác!');
    } finally {
      nutDangNhap.textContent = 'Đăng nhập';
      nutDangNhap.disabled = false;
    }
  }

});
