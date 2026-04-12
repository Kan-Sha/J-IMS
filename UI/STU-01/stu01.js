document.addEventListener('DOMContentLoaded', function () {
  const API_BASE = 'http://127.0.0.1:8080';

  function authHeaders(extra) {
    const token = localStorage.getItem('JIMS_TOKEN');
    const base = extra ? Object.assign({}, extra) : {};
    if (token) base.Authorization = `Bearer ${token}`;
    return base;
  }
  async function kiemTraSessionVaQuyenStu01() {
    try {
      const token = localStorage.getItem('JIMS_TOKEN');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
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

  kiemTraSessionVaQuyenStu01();

  const inputHo       = document.getElementById('ho');
  const inputTen      = document.getElementById('ten');
  const inputNgaySinh = document.getElementById('ngay-sinh');
  const inputGioiTinh = document.getElementById('gioi-tinh');
  const inputHoTenPH  = document.getElementById('ho-ten-ph');
  const inputMaHV     = document.getElementById('ma-hv');
  const inputEmail    = document.getElementById('email');
  const inputSdt      = document.getElementById('sdt');
  const inputDiaChi   = document.getElementById('dia-chi');

  const iconEmail = document.getElementById('icon-email');
  const iconSdt   = document.getElementById('icon-sdt');

  const nutLuu   = document.getElementById('nut-luu');
  const nutHuy   = document.getElementById('nut-huy');
  const overlay  = document.getElementById('overlay');
  const popup    = document.getElementById('popup');
  const popupNoiDung = document.getElementById('popup-noi-dung');
  const popupNutHuy  = document.getElementById('popup-nut-huy');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileSidebarBackdrop = document.getElementById('mobile-sidebar-backdrop');

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
  function computeNextStudentIdFromLatest(latestId) {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `JS-${yearMonth}-`;
    if (!latestId || typeof latestId !== 'string' || !latestId.startsWith(prefix)) {
      return `${prefix}001`;
    }
    const suffix = latestId.slice(prefix.length);
    const n = Number.parseInt(suffix, 10);
    const next = Number.isFinite(n) ? (n + 1) : 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
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

  /** Binds error UI to the specific input's wrapper (khung-input + loi-text in same .nhom-input). */
  function showError(inputEl, message) {
    if (!inputEl) return;
    const khung = inputEl.closest('.khung-input');
    const wrap = inputEl.closest('.nhom-input');
    if (!khung || !wrap) return;
    const loiEl = wrap.querySelector('.loi-text');
    khung.classList.add('loi-input');
    if (loiEl) {
      loiEl.textContent = message == null ? '' : String(message);
      loiEl.classList.add('hien');
    }
  }

  function clearError(inputEl) {
    if (!inputEl) return;
    const khung = inputEl.closest('.khung-input');
    const wrap = inputEl.closest('.nhom-input');
    if (!khung || !wrap) return;
    const loiEl = wrap.querySelector('.loi-text');
    khung.classList.remove('loi-input');
    if (loiEl) {
      loiEl.textContent = '';
      loiEl.classList.remove('hien');
    }
  }

  function clearAllFieldErrors() {
    [inputHo, inputTen, inputNgaySinh, inputHoTenPH, inputEmail, inputSdt, inputDiaChi].forEach(clearError);
  }

  const MSG_EMPTY = 'Mục này không được để trống!';
  const MSG_LETTERS_HO = 'Họ chỉ được chứa chữ cái!';
  const MSG_LETTERS_TEN = 'Tên chỉ được chứa chữ cái!';
  const MSG_LETTERS_PARENT = 'Họ tên chỉ được chứa chữ cái!';
  const NAME_MAX = 50;
  const PARENT_NAME_MAX = 50;
  const PARENT_NAME_MIN = 8;

  function isLettersOnlyUnicode(val) {
    const s = (val || '').trim();
    if (!s) return true;
    return /^[\p{L}]+(?:\s+[\p{L}]+)*$/u.test(s);
  }

  /**
   * Shared Họ / Tên rules (value must already be trimmed).
   * @param {string} lettersMsg message when letters-only rule fails
   */
  function validateName(value, lettersMsg) {
    if (value === '') return MSG_EMPTY;
    if (value.length > NAME_MAX) return 'Mỗi trường không được vượt quá 50 ký tự!';
    if (!isLettersOnlyUnicode(value)) return lettersMsg;
    return null;
  }

  /** Họ tên phụ huynh: one message per field; checks run in priority order. */
  function validateParentFullName(value) {
    if (value === '') return MSG_EMPTY;
    if (value.length > PARENT_NAME_MAX) return 'Họ tên không được vượt quá 50 ký tự';
    if (value.length < PARENT_NAME_MIN) return 'Họ tên phụ huynh phải có ít nhất 8 ký tự!';
    if (!isLettersOnlyUnicode(value)) return MSG_LETTERS_PARENT;
    return null;
  }

  function kiemTraNgaySinh(val) {
    if (!val) return MSG_EMPTY;
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
    ) return 'Ngày sinh không hợp lệ!';

    if (date > new Date()) return 'Ngày sinh không được ở tương lai!';

    // Age validation: minimum 5 years old based on current system date.
    const today = new Date();
    const maxDob = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
    if (date > maxDob) return 'Độ tuổi học sinh phải từ 5 tuổi trở lên';
    return null;
  }
  function kiemTraSdt(val) {
    if (!val) return MSG_EMPTY;
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
    clearError(this);
  });

  inputTen.addEventListener('input', function () {
    clearError(this);
  });

  inputNgaySinh.addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
    if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5);
    if (val.length > 10) val = val.slice(0, 10);
    this.value = val;
    clearError(this);
  });
  const EMAIL_REGEX_GMAIL = /^[A-Za-z0-9._%+-]+@gmail\.com$/i;

  inputHoTenPH.addEventListener('input', function () {
    clearError(this);
  });

  inputEmail.addEventListener('input', function () {
    clearError(this);
    anIcon(iconEmail);
    const val = this.value.trim();
    if (val && EMAIL_REGEX_GMAIL.test(val)) hienTick(iconEmail);
  });

  inputSdt.addEventListener('input', function () {
    clearError(this);
    anIcon(iconSdt);
    const val = this.value.trim();
    if (val && !kiemTraSdt(val)) hienTick(iconSdt);
  });

  inputDiaChi.addEventListener('input', function () {
    clearError(this);
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

    clearAllFieldErrors();

    anIcon(iconEmail);
    anIcon(iconSdt);
  });

  nutLuu.addEventListener('click', function () {
    let ho       = inputHo.value.trim();
    let ten      = inputTen.value.trim();
    let ngaySinh = inputNgaySinh.value.trim();
    const gioiTinh = inputGioiTinh.value;
    let hoTenPH  = inputHoTenPH.value.trim();
    let email    = inputEmail.value.trim();
    let sdt      = inputSdt.value.trim();
    let diaChi   = inputDiaChi.value.trim();

    inputHo.value = ho;
    inputTen.value = ten;
    inputHoTenPH.value = hoTenPH;
    inputNgaySinh.value = ngaySinh;
    inputEmail.value = email;
    inputSdt.value = sdt;
    inputDiaChi.value = diaChi;

    clearAllFieldErrors();
    anIcon(iconEmail);
    anIcon(iconSdt);

    let isValid = true;

    const errHo = validateName(ho, MSG_LETTERS_HO);
    if (errHo) {
      showError(inputHo, errHo);
      isValid = false;
    }
    const errTen = validateName(ten, MSG_LETTERS_TEN);
    if (errTen) {
      showError(inputTen, errTen);
      isValid = false;
    }

    let dobIso = null;
    const loiNgay = kiemTraNgaySinh(ngaySinh);
    if (loiNgay) {
      showError(inputNgaySinh, loiNgay);
      isValid = false;
    } else {
      dobIso = doiNgaySinhSangISO(ngaySinh);
      if (!dobIso) {
        showError(inputNgaySinh, 'Định dạng ngày sinh phải là DD/MM/YYYY!');
        isValid = false;
      }
    }

    const loiPh = validateParentFullName(hoTenPH);
    if (loiPh) {
      showError(inputHoTenPH, loiPh);
      isValid = false;
    }

    if (email && !EMAIL_REGEX_GMAIL.test(email)) {
      showError(inputEmail, 'Định dạng email không hợp lệ!');
      hienX(iconEmail);
      isValid = false;
    }
    const loiSdtMsg = kiemTraSdt(sdt);
    if (loiSdtMsg) {
      showError(inputSdt, loiSdtMsg);
      if (sdt) hienX(iconSdt); else anIcon(iconSdt);
      isValid = false;
    }

    const loiDiaChiMsg = kiemTraDiaChi(diaChi);
    if (loiDiaChiMsg) {
      showError(inputDiaChi, loiDiaChiMsg);
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    nutLuu.textContent = 'Đang lưu...';
    nutLuu.disabled    = true;

    fetch(`${API_BASE}/api/students`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({
        firstName: ten,
        lastName: ho,
        dob: dobIso,
        gender: gioiTinh,
        parentName: hoTenPH,
        phone: sdt,
        email: email || null,
        address: diaChi || null
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
          // Inline field validation errors (no popup)
          const data = payload && payload.data && typeof payload.data === 'object' ? payload.data : null;
          if (res.status === 400 && data) {
            if (data.firstName) showError(inputTen, String(data.firstName));
            if (data.lastName) showError(inputHo, String(data.lastName));
            if (data.dob) showError(inputNgaySinh, String(data.dob));
            if (data.parentName) showError(inputHoTenPH, String(data.parentName));
            if (data.phone) showError(inputSdt, String(data.phone));
            if (data.email) showError(inputEmail, String(data.email));
            if (data.address) showError(inputDiaChi, String(data.address));
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
    document.body.classList.remove('mobile-sidebar-open');
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

  function closeMobileSidebar() {
    document.body.classList.remove('mobile-sidebar-open');
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function () {
      document.body.classList.toggle('mobile-sidebar-open');
    });
  }
  if (mobileSidebarBackdrop) {
    mobileSidebarBackdrop.addEventListener('click', closeMobileSidebar);
  }
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 768) {
      closeMobileSidebar();
    }
  });
});