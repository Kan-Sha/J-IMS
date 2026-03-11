document.addEventListener('DOMContentLoaded', function () {
  const API_BASE = 'http://127.0.0.1:8080';

  function authHeaders(extra) {
    const token = localStorage.getItem('JIMS_TOKEN');
    const base = extra ? Object.assign({}, extra) : {};
    if (token) base.Authorization = `Bearer ${token}`;
    return base;
  }
  const inputHo       = document.getElementById('ho');
  const inputTen      = document.getElementById('ten');
  const inputNgaySinh = document.getElementById('ngay-sinh');
  const inputGioiTinh = document.getElementById('gioi-tinh');
  const inputHoTenPH  = document.getElementById('ho-ten-ph');
  const inputMaHV     = document.getElementById('ma-hv');
  const inputLop      = document.getElementById('lop');
  const inputEmail    = document.getElementById('email');
  const inputSdt      = document.getElementById('sdt');
  const inputDiaChi   = document.getElementById('dia-chi');

  const khungHo       = document.getElementById('khung-ho');
  const khungTen      = document.getElementById('khung-ten');
  const khungNgaySinh = document.getElementById('khung-ngay-sinh');
  const khungEmail    = document.getElementById('khung-email');
  const khungSdt      = document.getElementById('khung-sdt');
  const khungDiaChi   = document.getElementById('khung-dia-chi');

  const loiHoTen    = document.getElementById('loi-ho-ten');
  const loiNgaySinh = document.getElementById('loi-ngay-sinh');
  const loiEmail    = document.getElementById('loi-email');
  const loiSdt      = document.getElementById('loi-sdt');
  const loiDiaChi   = document.getElementById('loi-dia-chi');

  const iconEmail = document.getElementById('icon-email');
  const iconSdt   = document.getElementById('icon-sdt');

  const nutLuu   = document.getElementById('nut-luu');
  const nutHuy   = document.getElementById('nut-huy');
  const overlay  = document.getElementById('overlay');
  const popup    = document.getElementById('popup');
  const popupNoiDung = document.getElementById('popup-noi-dung');
  const popupNutHuy  = document.getElementById('popup-nut-huy');

  function taoSelectHienThi(khungSelect, selectEl) {
    const span = document.createElement('span');
    span.className = 'select-hien-thi';
    span.textContent = selectEl.options[selectEl.selectedIndex]
      ? selectEl.options[selectEl.selectedIndex].text : '';
    khungSelect.insertBefore(span, khungSelect.querySelector('.icon-select'));
    selectEl.addEventListener('change', function () {
      span.textContent = this.options[this.selectedIndex].text;
    });
    return span;
  }

  taoSelectHienThi(document.getElementById('khung-gioi-tinh'), inputGioiTinh);

  let lopSelectSpan = null;

  async function taiDanhSachLop() {
    inputLop.innerHTML = '';
    try {
      const res = await fetch(`${API_BASE}/api/classes`, {
        credentials: 'include',
        headers: authHeaders()
      });
      if (res.status === 401) {
        window.location.href = '../AUT-02/aut02.html';
        return;
      }
      const payload = await res.json().catch(() => null);
      const classes = payload && payload.success && Array.isArray(payload.data) ? payload.data : null;

      if (!classes) {
        throw new Error('Không thể tải danh sách lớp');
      }

      const lopConCho = classes.filter(l => (l.currentSize || 0) < (l.capacity || 0));
      if (lopConCho.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Không có lớp nào còn chỗ';
        opt.disabled = true;
        inputLop.appendChild(opt);
      } else {
        lopConCho.forEach(l => {
          const conLai = (l.capacity || 0) - (l.currentSize || 0);
          const opt = document.createElement('option');
          opt.value = String(l.classId);
          opt.textContent = `${l.className} (còn ${conLai})`;
          inputLop.appendChild(opt);
        });
      }
    } catch (e) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Không thể tải danh sách lớp';
      opt.disabled = true;
      inputLop.appendChild(opt);
    } finally {
      if (lopSelectSpan) {
        // keep current span, just trigger text refresh
        inputLop.dispatchEvent(new Event('change'));
      } else {
        lopSelectSpan = taoSelectHienThi(document.getElementById('khung-lop'), inputLop);
      }
    }
  }

  taiDanhSachLop();
  function computeNextStudentIdFromLatest(latestId) {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `JS-${yearMonth}-`;
    if (!latestId || typeof latestId !== 'string' || !latestId.startsWith(prefix)) {
      return `${prefix}0001`;
    }
    const suffix = latestId.slice(prefix.length);
    const n = Number.parseInt(suffix, 10);
    const next = Number.isFinite(n) ? (n + 1) : 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  async function taiMaHocVienMoi() {
    try {
      const res = await fetch(`${API_BASE}/api/students/next-id`, {
        credentials: 'include',
        headers: authHeaders()
      });
      if (res.status === 401) {
        window.location.href = '../AUT-02/aut02.html';
        return;
      }
      const payload = await res.json().catch(() => null);
      const id = payload && payload.success && payload.data && payload.data.studentId
        ? String(payload.data.studentId)
        : null;
      if (id) {
        inputMaHV.value = id;
        return;
      }
      const latest = payload && payload.data && payload.data.latestId ? String(payload.data.latestId) : null;
      inputMaHV.value = computeNextStudentIdFromLatest(latest);
    } catch (e) {
      inputMaHV.value = computeNextStudentIdFromLatest(null);
    }
  }

  taiMaHocVienMoi();


  const SVG_TICK = `<svg viewBox="0 0 24 24" fill="none" stroke="#2f9e44" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg>`;
  const SVG_X    = `<svg viewBox="0 0 24 24" fill="none" stroke="#ff0000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  function hienTick(iconEl) { iconEl.innerHTML = SVG_TICK; iconEl.classList.add('hien'); }
  function hienX(iconEl)    { iconEl.innerHTML = SVG_X;    iconEl.classList.add('hien'); }
  function anIcon(iconEl)   { iconEl.innerHTML = '';        iconEl.classList.remove('hien'); }

  function hienLoi(khung, loiEl, noiDung) {
    khung.classList.add('loi-input');
    if (loiEl) {
      loiEl.textContent = noiDung;
      loiEl.classList.add('hien');
    }
  }

  function xoaLoi(khung, loiEl) {
    khung.classList.remove('loi-input');
    if (loiEl) {
      loiEl.textContent = '';
      loiEl.classList.remove('hien');
    }
  }

  function capNhatNutLuu() {
    const conLoi = document.querySelector('.loi-text.hien');
    nutLuu.classList.toggle('bi-vo-hieu', !!conLoi);
  }

  function kiemTraHoTen(ho, ten) {
    if (!ho || !ten) return { loiHo: !ho, loiTen: !ten, msg: 'Mục này không được để trống!' };
    const full = (ho + ' ' + ten).trim();
    if (full.length < 8)   return { msg: 'Họ và tên phải có ít nhất 8 ký tự!' };
    if (full.length > 100) return { msg: 'Họ và tên không được vượt quá 100 ký tự!' };
    return null;
  }

  function kiemTraNgaySinh(val) {
    if (!val) return 'Ngày sinh không được để trống!';
    const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return 'Định dạng ngày sinh phải là DD/MM/YYYY!';

    const ngay  = parseInt(match[1], 10);
    const thang = parseInt(match[2], 10);
    const nam   = parseInt(match[3], 10);

    if (thang < 1 || thang > 12) return 'Tháng không hợp lệ!';
    if (ngay  < 1 || ngay  > 31) return 'Ngày không hợp lệ!';
    if (nam < 1900)               return 'Năm sinh không hợp lệ!';

    const date = new Date(nam, thang - 1, ngay);
    if (
      date.getFullYear() !== nam ||
      date.getMonth() + 1 !== thang ||
      date.getDate() !== ngay
    ) return 'Ngày sinh không tồn tại!';

    if (date > new Date()) return 'Ngày sinh không được ở tương lai!';
    return null;
  }
  function kiemTraSdt(val) {
    if (!val) return 'Số điện thoại không được để trống!';
    const regex = /^(\+84|0)[0-9]{9,11}$/;
    if (!regex.test(val)) return 'Số điện thoại không hợp lệ!';
    return null;
  }
  function kiemTraDiaChi(val) {
    if (!val) return null; 
    if (val.length < 8)   return 'Địa chỉ phải có ít nhất 8 ký tự!';
    if (val.length > 255) return 'Địa chỉ không được vượt quá 255 ký tự!';
    return null;
  }

  function doiNgaySinhSangISO(val) {
    const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const dd = match[1];
    const mm = match[2];
    const yyyy = match[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  inputHo.addEventListener('input', function () {
    xoaLoi(khungHo, null);
    if (this.value.trim() && inputTen.value.trim()) {
      loiHoTen.textContent = '';
      loiHoTen.classList.remove('hien');
    }
    capNhatNutLuu();
  });

  inputTen.addEventListener('input', function () {
    xoaLoi(khungTen, null);
    if (inputHo.value.trim() && this.value.trim()) {
      loiHoTen.textContent = '';
      loiHoTen.classList.remove('hien');
    }
    capNhatNutLuu();
  });

  inputNgaySinh.addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
    if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5);
    if (val.length > 10) val = val.slice(0, 10);
    this.value = val;
    xoaLoi(khungNgaySinh, loiNgaySinh);
    capNhatNutLuu();
  });
  inputEmail.addEventListener('input', function () {
    xoaLoi(khungEmail, loiEmail);
    anIcon(iconEmail);
    const val = this.value.trim();
    if (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) hienTick(iconEmail);
    capNhatNutLuu();
  });

  inputSdt.addEventListener('input', function () {
    xoaLoi(khungSdt, loiSdt);
    anIcon(iconSdt);
    const val = this.value.trim();
    if (val && !kiemTraSdt(val)) hienTick(iconSdt);
    capNhatNutLuu();
  });

  inputDiaChi.addEventListener('input', function () {
    xoaLoi(khungDiaChi, loiDiaChi);
    capNhatNutLuu();
  });

  function hienPopup(noiDung) {
    popupNoiDung.textContent = noiDung;
    overlay.classList.add('hien');
    popup.classList.add('hien');
  }

  function anPopup() {
    overlay.classList.remove('hien');
    popup.classList.remove('hien');
  }

  popupNutHuy.addEventListener('click', anPopup);
  overlay.addEventListener('click', anPopup);

  nutHuy.addEventListener('click', function () {
    inputHo.value       = '';
    inputTen.value      = '';
    inputNgaySinh.value = '';
    inputHoTenPH.value  = '';
    inputEmail.value    = '';
    inputSdt.value      = '';
    inputDiaChi.value   = '';
    taiMaHocVienMoi();

    xoaLoi(khungHo,       null);
    xoaLoi(khungTen,      null);
    xoaLoi(khungNgaySinh, loiNgaySinh);
    xoaLoi(khungEmail,    loiEmail);
    xoaLoi(khungSdt,      loiSdt);
    xoaLoi(khungDiaChi,   loiDiaChi);

    loiHoTen.textContent = '';
    loiHoTen.classList.remove('hien');

    anIcon(iconEmail);
    anIcon(iconSdt);
    nutLuu.classList.remove('bi-vo-hieu');
  });

  nutLuu.addEventListener('click', function () {
    if (nutLuu.classList.contains('bi-vo-hieu')) return;

    const ho       = inputHo.value.trim();
    const ten      = inputTen.value.trim();
    const ngaySinh = inputNgaySinh.value.trim();
    const gioiTinh = inputGioiTinh.value;
    const hoTenPH  = inputHoTenPH.value.trim();
    const lopIdRaw = inputLop.value;
    const email    = inputEmail.value.trim();
    const sdt      = inputSdt.value.trim();
    const diaChi   = inputDiaChi.value.trim();
    xoaLoi(khungHo,       null);
    xoaLoi(khungTen,      null);
    xoaLoi(khungNgaySinh, loiNgaySinh);
    xoaLoi(khungEmail,    loiEmail);
    xoaLoi(khungSdt,      loiSdt);
    xoaLoi(khungDiaChi,   loiDiaChi);
    loiHoTen.textContent = '';
    loiHoTen.classList.remove('hien');

    let coLoi = false;

    const loiHoTenKQ = kiemTraHoTen(ho, ten);
    if (loiHoTenKQ) {
      if (loiHoTenKQ.loiHo)  hienLoi(khungHo,  null, '');
      if (loiHoTenKQ.loiTen) hienLoi(khungTen, null, '');
      loiHoTen.textContent = loiHoTenKQ.msg;
      loiHoTen.classList.add('hien');
      coLoi = true;
    }

    const loiNgay = kiemTraNgaySinh(ngaySinh);
    if (loiNgay) {
      hienLoi(khungNgaySinh, loiNgaySinh, loiNgay);
      coLoi = true;
    }

    if (!hoTenPH) {
      hienLoi(document.getElementById('khung-ho-ten-ph'), null, '');
      coLoi = true;
    }

    if (!lopIdRaw) {
      coLoi = true;
    }

    if (!email) {
      hienLoi(khungEmail, loiEmail, 'Mục này không được để trống!');
      anIcon(iconEmail);
      coLoi = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      hienLoi(khungEmail, loiEmail, 'Sai định dạng email!');
      hienX(iconEmail);
      coLoi = true;
    }
    const loiSdtMsg = kiemTraSdt(sdt);
    if (loiSdtMsg) {
      hienLoi(khungSdt, loiSdt, loiSdtMsg);
      if (sdt) hienX(iconSdt); else anIcon(iconSdt);
      coLoi = true;
    }

    const loiDiaChiMsg = kiemTraDiaChi(diaChi);
    if (loiDiaChiMsg) {
      hienLoi(khungDiaChi, loiDiaChi, loiDiaChiMsg);
      coLoi = true;
    }

    if (coLoi) {
      nutLuu.classList.add('bi-vo-hieu');
      if (!hoTenPH) {
        hienPopup('Họ tên phụ huynh không được để trống!');
      } else if (!lopIdRaw) {
        hienPopup('Vui lòng chọn lớp hợp lệ!');
      }
      return;
    }

    const dobIso = doiNgaySinhSangISO(ngaySinh);
    if (!dobIso) {
      hienLoi(khungNgaySinh, loiNgaySinh, 'Định dạng ngày sinh phải là DD/MM/YYYY!');
      nutLuu.classList.add('bi-vo-hieu');
      return;
    }

    nutLuu.textContent = 'Đang lưu...';
    nutLuu.disabled    = true;

    fetch(`${API_BASE}/api/students`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({
        firstName: ho,
        lastName: ten,
        dob: dobIso,
        gender: gioiTinh,
        parentName: hoTenPH,
        phone: sdt,
        email: email || null,
        address: diaChi || null,
        classId: parseInt(lopIdRaw, 10)
      })
    })
      .then(res => res.json().catch(() => null).then(payload => ({ res, payload })))
      .then(({ res, payload }) => {
        const success = !!(payload && payload.success);
        const message = payload && payload.message ? payload.message : 'Lưu thất bại!';

        if (!success) {
          if (res.status === 401) {
            window.location.href = '../AUT-02/aut02.html';
            return;
          }
          hienPopup(message);
          return;
        }

        const studentId = payload && payload.data && payload.data.studentId ? payload.data.studentId : null;
        if (studentId) {
          inputMaHV.value = studentId;
        }

        inputHo.value       = '';
        inputTen.value      = '';
        inputNgaySinh.value = '';
        inputHoTenPH.value  = '';
        inputEmail.value    = '';
        inputSdt.value      = '';
        inputDiaChi.value   = '';
        taiMaHocVienMoi();

        anIcon(iconEmail);
        anIcon(iconSdt);
        nutLuu.classList.remove('bi-vo-hieu');

        taiDanhSachLop();
        hienPopup(studentId ? `Thêm học sinh thành công! Mã: ${studentId}` : 'Thêm học sinh thành công!');
      })
      .catch(() => {
        hienPopup('Không thể kết nối server. Hãy kiểm tra backend đang chạy.');
      })
      .finally(() => {
        nutLuu.textContent = 'Lưu';
        nutLuu.disabled    = false;
      });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter'  && !popup.classList.contains('hien')) nutLuu.click();
    if (e.key === 'Escape' &&  popup.classList.contains('hien')) anPopup();
  });
const nutDangXuatSidebar = document.querySelector('[title="Đăng xuất"]');
  const overlayDX = document.getElementById('overlay-dang-xuat');
  const popupDX   = document.getElementById('popup-dang-xuat');
const nutHocSinhSidebar = document.querySelector('[title="Hồ sơ học sinh"]');
  function hienPopupDangXuat() {
    overlayDX.style.display = 'block';
    popupDX.style.display   = 'block';
    nutHocSinhSidebar.classList.remove('active');
    nutDangXuatSidebar.classList.add('active');
  }

  function anPopupDangXuat() {
    overlayDX.style.display = 'none';
    popupDX.style.display   = 'none';
    nutDangXuatSidebar.classList.remove('active');
    nutHocSinhSidebar.classList.add('active');
  }

  nutDangXuatSidebar.addEventListener('click', function(e) {
    e.preventDefault();
    hienPopupDangXuat();
  });

  document.getElementById('popup-dx-huy').addEventListener('click', anPopupDangXuat);
  overlayDX.addEventListener('click', anPopupDangXuat);
  document.getElementById('popup-dx-xac-nhan').addEventListener('click', function() {
    localStorage.removeItem('JIMS_TOKEN');
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders()
    })
      .catch(() => null)
      .finally(() => {
        anPopupDangXuat();
        window.location.href = '../AUT-02/aut02.html';
      });
  });
});