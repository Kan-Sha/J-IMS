document.addEventListener('DOMContentLoaded', function () {

  const inputHoTen    = document.getElementById('ho-ten');
  const inputEmail    = document.getElementById('email');
  const inputMatKhau  = document.getElementById('mat-khau');
  inputMatKhau.value = 'JoyEnglish@123';
  const inputChucVu   = document.getElementById('chuc-vu');

  const khungHoTen    = document.getElementById('khung-ho-ten');
  const khungEmail    = document.getElementById('khung-email');
  const khungMatKhau  = document.getElementById('khung-mat-khau');
  const khungChucVu   = document.getElementById('khung-chuc-vu');

  const loiHoTen      = document.getElementById('loi-ho-ten');
  const loiEmail      = document.getElementById('loi-email');
  const loiMatKhau    = document.getElementById('loi-mat-khau');
  const loiChucVu     = document.getElementById('loi-chuc-vu');

  const iconTickEmail = document.getElementById('icon-tick-email');
  const iconMat       = document.getElementById('icon-mat');
  const nutToggleMK   = document.getElementById('nut-toggle-mk');
  const nutLuu        = document.getElementById('nut-luu');
  const nutHuy        = document.getElementById('nut-huy');
  const thongBao      = document.getElementById('thong-bao');
  const nutDangXuatSidebar = document.getElementById('sidebar-logout');
  const overlayDX = document.getElementById('overlay-dang-xuat');
  const popupDX   = document.getElementById('popup-dang-xuat');
  const popupDXNutHuy = document.getElementById('popup-dx-huy');
  const popupDXNutXacNhan = document.getElementById('popup-dx-xac-nhan');

  let dangHienMatKhau = false;
  const EMAIL_REGEX_COM = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/;
  const API_BASE = (() => {
    const host = window.location && window.location.hostname ? window.location.hostname : '127.0.0.1';
    return `${window.location.protocol}//${host}:8080`;
  })();

  async function kiemTraSessionVaQuyenAut01() {
    try {
      const token = localStorage.getItem('JIMS_TOKEN');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/api/auth/session`, {
        method: 'GET',
        credentials: 'include',
        headers
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload || !payload.success) {
        localStorage.removeItem('JIMS_TOKEN');
        window.location.href = '../AUT-02/aut02.html';
        return null;
      }
      const data = payload.data || {};
      const role = data.role ? String(data.role) : null;
      if (role && role.toLowerCase() !== 'admin') {
        window.location.href = '../STU-03/stu03.html';
        return null;
      }
      return role;
    } catch (e) {
      localStorage.removeItem('JIMS_TOKEN');
      window.location.href = '../AUT-02/aut02.html';
      return null;
    }
  }

  kiemTraSessionVaQuyenAut01();

  const danhSachEmailTonTai = [
    'admin@gmail.com',
    'existaccount@gmail.com'
  ];

  const selectHienThi = document.createElement('span');
  selectHienThi.className = 'select-hien-thi';
  selectHienThi.textContent = '-- Chọn chức vụ --';
  khungChucVu.insertBefore(selectHienThi, khungChucVu.querySelector('.icon-select'));

  inputChucVu.addEventListener('change', function () {
    const text = this.options[this.selectedIndex].text;
    selectHienThi.textContent = text;
    if (this.value) {
      selectHienThi.classList.add('co-gia-tri');
    } else {
      selectHienThi.classList.remove('co-gia-tri');
    }
    xoaLoi(khungChucVu, loiChucVu);
    capNhatNutLuu();
  });

  function hienLoi(khung, loiEl, noiDung) {
    khung.classList.add('loi-input');
    loiEl.textContent = noiDung;
    loiEl.classList.add('hien');

    const input = khung.querySelector('.o-nhap');
    if (input && input.type === 'password') {
      input.setAttribute('placeholder', '');
    }
  }

  function xoaLoi(khung, loiEl) {
    khung.classList.remove('loi-input');
    loiEl.textContent = '';
    loiEl.classList.remove('hien');

    const input = khung.querySelector('.o-nhap');
    if (input && input.type === 'password') {
      input.setAttribute('placeholder', 'JoyEnglish@123');
    }
  }

  function capNhatNutLuu() {
    const conLoi = document.querySelector('.loi-text.hien');
    if (conLoi) {
      nutLuu.classList.add('bi-vo-hieu');
    } else {
      nutLuu.classList.remove('bi-vo-hieu');
    }
  }
  inputHoTen.addEventListener('input', function () {
    xoaLoi(khungHoTen, loiHoTen);
    capNhatNutLuu();
  });

  inputMatKhau.addEventListener('input', function () {
    xoaLoi(khungMatKhau, loiMatKhau);
    capNhatNutLuu();
  });

  inputEmail.addEventListener('input', function () {
    xoaLoi(khungEmail, loiEmail);
    iconTickEmail.classList.remove('hien');

    if (EMAIL_REGEX_COM.test(this.value.trim())) {
      iconTickEmail.classList.add('hien');
    }
    capNhatNutLuu();
  });

  nutHuy.addEventListener('click', function () {
    inputHoTen.value   = '';
    inputEmail.value   = '';
    inputMatKhau.value = 'JoyEnglish@123';
    inputChucVu.value  = '';

    selectHienThi.textContent = '-- Chọn chức vụ --';
    selectHienThi.classList.remove('co-gia-tri');

    xoaLoi(khungHoTen,   loiHoTen);
    xoaLoi(khungEmail,   loiEmail);
    xoaLoi(khungMatKhau, loiMatKhau);
    xoaLoi(khungChucVu,  loiChucVu);

    iconTickEmail.classList.remove('hien');
    nutLuu.classList.remove('bi-vo-hieu');

    thongBao.style.display = 'none';
    thongBao.className = 'thong-bao';
  });

  nutLuu.addEventListener('click', function () {
    if (nutLuu.classList.contains('bi-vo-hieu')) return;

    const hoTen   = inputHoTen.value.trim();
    const email   = inputEmail.value.trim();
    const matKhau = inputMatKhau.value;
    const chucVu  = inputChucVu.value;

    xoaLoi(khungHoTen,   loiHoTen);
    xoaLoi(khungEmail,   loiEmail);
    xoaLoi(khungMatKhau, loiMatKhau);
    xoaLoi(khungChucVu,  loiChucVu);
    thongBao.style.display = 'none';
    thongBao.className = 'thong-bao';

    let coLoi = false;

    if (!hoTen) {
      hienLoi(khungHoTen, loiHoTen, 'Mục này không được để trống!');
      coLoi = true;
    }

    const emailHopLe = EMAIL_REGEX_COM.test(email);

    if (!email) {
      hienLoi(khungEmail, loiEmail, 'Mục này không được để trống!');
      coLoi = true;
    } else if (!emailHopLe) {
      hienLoi(khungEmail, loiEmail, 'Định dạng email không hợp lệ!');
      coLoi = true;
    } else if (danhSachEmailTonTai.includes(email.toLowerCase())) {
      hienLoi(khungEmail, loiEmail, 'Email này đã tồn tại!');
      coLoi = true;
    }

    if (!matKhau) {
      hienLoi(khungMatKhau, loiMatKhau, 'Mục này không được để trống!');
      coLoi = true;
    } else if (matKhau.length < 6) {
      hienLoi(khungMatKhau, loiMatKhau, 'Mật khẩu phải có ít nhất 6 ký tự!');
      coLoi = true;
    }
    if (!chucVu) {
      hienLoi(khungChucVu, loiChucVu, 'Mục này không được để trống!');
      coLoi = true;
    }

    if (coLoi) {
      nutLuu.classList.add('bi-vo-hieu');
      return;
    }

    // Lớp bảo vệ cuối cùng: không gọi API nếu email không đúng dạng username@provider.com
    if (!EMAIL_REGEX_COM.test(email)) {
      hienLoi(khungEmail, loiEmail, 'Định dạng email không hợp lệ!');
      capNhatNutLuu();
      return;
    }

    taoTaiKhoan(hoTen, email, matKhau, chucVu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') nutLuu.click();
  });

  function mapChucVuToBackendRole(value) {
    if (value === 'giao-vien') return 'Giáo viên';
    if (value === 'tro-giang') return 'Trợ giảng';
    if (value === 'admin') return 'Admin';
    return value;
  }

  function showThongBao(type, message) {
    thongBao.style.display = 'flex';
    thongBao.className = 'thong-bao';
    if (type === 'success') thongBao.classList.add('thanh-cong');
    if (type === 'error') thongBao.classList.add('loi');
    thongBao.textContent = message || '';
  }

  async function xuLyDangXuat() {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(() => null);
    } finally {
      window.location.href = '../AUT-02/aut02.html';
    }
  }

  function hienPopupDangXuat() {
    if (!overlayDX || !popupDX) return;
    overlayDX.style.display = 'block';
    popupDX.style.display = 'block';
  }

  function anPopupDangXuat() {
    if (!overlayDX || !popupDX) return;
    overlayDX.style.display = 'none';
    popupDX.style.display = 'none';
  }

  if (nutDangXuatSidebar) {
    nutDangXuatSidebar.addEventListener('click', function (e) {
      e.preventDefault();
      hienPopupDangXuat();
    });
  }

  if (popupDXNutHuy) popupDXNutHuy.addEventListener('click', anPopupDangXuat);
  if (overlayDX) overlayDX.addEventListener('click', anPopupDangXuat);
  if (popupDXNutXacNhan) {
    popupDXNutXacNhan.addEventListener('click', function () {
      xuLyDangXuat();
    });
  }

  async function taoTaiKhoan(hoTen, email, matKhau, chucVu) {
    nutLuu.textContent = 'Đang lưu...';
    nutLuu.disabled = true;

    try {
      const role = mapChucVuToBackendRole(chucVu);
      const res = await fetch(`${API_BASE}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: hoTen,
          email,
          password: matKhau,
          role
        })
      });

      const payload = await res.json().catch(() => null);
      const success = !!(payload && payload.success);
      const message = payload && payload.message ? payload.message : 'Tạo tài khoản thất bại!';

      if (!success) {
        if (res.status === 401 || res.status === 403) {
          showThongBao('error', 'Bạn cần đăng nhập Admin trước khi tạo tài khoản.');
          return;
        }
        showThongBao('error', message);
        return;
      }

      danhSachEmailTonTai.push(email.toLowerCase());
      showThongBao('success', '✅ Tạo tài khoản thành công!');

      inputHoTen.value = '';
      inputEmail.value = '';
      inputMatKhau.value = 'JoyEnglish@123';
      inputChucVu.value = '';
      selectHienThi.textContent = '-- Chọn chức vụ --';
      selectHienThi.classList.remove('co-gia-tri');
      iconTickEmail.classList.remove('hien');
      nutLuu.classList.remove('bi-vo-hieu');
    } catch (err) {
      showThongBao('error', 'Không thể kết nối server. Hãy kiểm tra backend đang chạy.');
    } finally {
      nutLuu.textContent = 'Lưu';
      nutLuu.disabled = false;
    }
  }
});