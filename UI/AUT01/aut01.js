document.addEventListener('DOMContentLoaded', function () {

  const inputHoTen    = document.getElementById('ho-ten');
  const inputEmail    = document.getElementById('email');
  const inputMatKhau  = document.getElementById('mat-khau');
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

  let dangHienMatKhau = false;

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

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (regexEmail.test(this.value.trim())) {
      iconTickEmail.classList.add('hien');
    }
    capNhatNutLuu();
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


  nutHuy.addEventListener('click', function () {
    inputHoTen.value   = '';
    inputEmail.value   = '';
    inputMatKhau.value = '';
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

    if (!email) {
      hienLoi(khungEmail, loiEmail, 'Mục này không được để trống!');
      coLoi = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
    nutLuu.textContent = 'Đang lưu...';
    nutLuu.disabled    = true;

    setTimeout(() => {
      nutLuu.textContent = 'Lưu';
      nutLuu.disabled    = false;
      danhSachEmailTonTai.push(email.toLowerCase());
      thongBao.innerHTML = '✅ Tạo tài khoản thành công!';
      thongBao.classList.add('thanh-cong');
      thongBao.style.display = 'flex';
      inputHoTen.value   = '';
      inputEmail.value   = '';
      inputMatKhau.value = '';
      inputChucVu.value  = '';
      selectHienThi.textContent = '-- Chọn chức vụ --';
      selectHienThi.classList.remove('co-gia-tri');
      iconTickEmail.classList.remove('hien');
      nutLuu.classList.remove('bi-vo-hieu');

    }, 800);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') nutLuu.click();
  });

});