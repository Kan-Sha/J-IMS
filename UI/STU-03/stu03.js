document.addEventListener('DOMContentLoaded', function () {
  const API_BASE = 'http://127.0.0.1:8080';

  function authHeaders(extra) {
    const token = localStorage.getItem('JIMS_TOKEN');
    const base = extra ? Object.assign({}, extra) : {};
    if (token) base.Authorization = `Bearer ${token}`;
    return base;
  }

  function runStu03() {

  let danhSachHocSinh = [];
  let danhSachLop = [];
  let danhSachTrangThai = [];
  const inputTimKiem   = document.getElementById('tim-kiem');
  const selectLop      = document.getElementById('loc-lop');
  const selectTrangThai = document.getElementById('loc-trang-thai');
  const hienThiLop     = document.getElementById('hien-thi-lop');
  const hienThiTrangThai = document.getElementById('hien-thi-trang-thai');
  const nutTimKiem     = document.getElementById('nut-tim-kiem');
  const nutDatLai      = document.getElementById('nut-dat-lai');
  const bangThan       = document.getElementById('bang-than');
  const overlay        = document.getElementById('overlay');
  const popup          = document.getElementById('popup');
  const popupNoiDung   = document.getElementById('popup-noi-dung');
  const popupNutHuy    = document.getElementById('popup-nut-huy');
  const overlayDX = document.getElementById('overlay-dang-xuat');
  const popupDX   = document.getElementById('popup-dang-xuat');
  const popupDXNutHuy = document.getElementById('popup-dx-huy');
  const popupDXNutXacNhan = document.getElementById('popup-dx-xac-nhan');
  const nutDangXuatSidebar = document.querySelector('[title="Đăng xuất"]');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileSidebarBackdrop = document.getElementById('mobile-sidebar-backdrop');
  selectLop.addEventListener('change', function () {
    hienThiLop.textContent = this.value ? this.options[this.selectedIndex].text : 'Chọn lớp';
  });

  selectTrangThai.addEventListener('change', function () {
    hienThiTrangThai.textContent = this.value ? this.options[this.selectedIndex].text : 'Chọn trạng thái';
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

  function formatDob(isoDate) {
    if (!isoDate || typeof isoDate !== 'string') return '';
    const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return isoDate;
    return `${m[3]}/${m[2]}/${m[1]}`;
  }

  function normalizeGender(val) {
    if (!val) return '';
    const s = String(val).toLowerCase();
    if (s === 'nam' || s === 'male') return 'Nam';
    if (s === 'nu' || s === 'nữ' || s === 'female') return 'Nữ';
    return String(val);
  }

  function statusClassFromName(statusName) {
    const s = statusName ? String(statusName).toLowerCase() : '';
    if (s === 'đang học') return 'dang-hoc';
    if (s === 'nghỉ học') return 'nghi-hoc';
    return '';
  }

  function renderBang(ds) {
    bangThan.innerHTML = '';
    ds.forEach(function (hs) {
      const tenTrangThai = hs.trangThaiTen || '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${hs.ma || ''}</td>
        <td>${hs.hoTen || ''}</td>
        <td>${hs.ngaySinh || ''}</td>
        <td>${hs.gioiTinh || ''}</td>
        <td>${hs.lop || ''}</td>
        <td>${tenTrangThai ? `<span class="trang-thai ${hs.trangThaiCss || ''}">${tenTrangThai}</span>` : ''}</td>
      `;
      bangThan.appendChild(tr);
    });
  }

  async function taiDanhSachLop() {
    try {
      const res = await fetch(`${API_BASE}/api/classes`, {
        credentials: 'include',
        headers: authHeaders()
      });
      const payload = await res.json().catch(() => null);
      const classes = payload && payload.success && Array.isArray(payload.data) ? payload.data : null;
      if (!classes) throw new Error('Không thể tải danh sách lớp');

      danhSachLop = classes;
      const current = selectLop.value;
      selectLop.innerHTML = '<option value=\"\">Chọn lớp</option>';
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = String(c.classId);
        opt.textContent = String(c.className);
        selectLop.appendChild(opt);
      });
      selectLop.value = current;
      selectLop.dispatchEvent(new Event('change'));
    } catch (e) {
      // keep existing options if any
    }
  }

  async function taiDanhSachTrangThai() {
    try {
      const res = await fetch(`${API_BASE}/api/learning-status`, {
        credentials: 'include',
        headers: authHeaders()
      });
      const payload = await res.json().catch(() => null);
      const statuses = payload && payload.success && Array.isArray(payload.data) ? payload.data : null;
      if (!statuses) throw new Error("Không thể tải trạng thái học tập");

      danhSachTrangThai = statuses;
      const current = selectTrangThai.value;
      selectTrangThai.innerHTML = '<option value=\"\">Chọn trạng thái</option>';
      statuses.forEach(s => {
        const opt = document.createElement('option');
        opt.value = String(s.statusId);
        opt.textContent = String(s.statusName);
        selectTrangThai.appendChild(opt);
      });
      selectTrangThai.value = current;
      selectTrangThai.dispatchEvent(new Event('change'));
    } catch (e) {
      // keep existing options if any
    }
  }

  async function taiDanhSachHocSinh() {
    try {
      const res = await fetch(`${API_BASE}/api/students`, {
        credentials: 'include',
        headers: authHeaders()
      });
      const payload = await res.json().catch(() => null);

      if (!payload || !payload.success || !Array.isArray(payload.data)) {
        if (res.status === 401) {
          window.location.href = '../AUT-02/aut02.html';
          return;
        }
        hienPopup((payload && payload.message) ? payload.message : 'Không thể tải danh sách học sinh.');
        renderBang([]);
        return;
      }

      danhSachHocSinh = payload.data.map(row => {
        const classId = row.classId != null ? String(row.classId) : '';
        const className = row.className != null ? String(row.className) : '';
        const statusId = row.statusId != null ? String(row.statusId) : '';
        const statusName = row.statusName != null ? String(row.statusName) : '';
        return {
          ma: row.studentId != null ? String(row.studentId) : '',
          hoTen: row.fullName != null ? String(row.fullName) : '',
          ngaySinh: formatDob(row.dob),
          gioiTinh: normalizeGender(row.gender),
          lop: className || classId,
          lopId: classId,
          trangThaiId: statusId,
          trangThaiTen: statusName,
          trangThaiCss: statusClassFromName(statusName)
        };
      });

      renderBang(danhSachHocSinh);
    } catch (e) {
      hienPopup('Không thể kết nối server. Hãy kiểm tra backend đang chạy.');
      renderBang([]);
    }
  }
  nutTimKiem.addEventListener('click', function () {
    const tuKhoa     = inputTimKiem.value.trim().toLowerCase();
    const lopChon    = selectLop.value;
    const trangThai  = selectTrangThai.value;

    const ketQua = danhSachHocSinh.filter(function (hs) {
      const hopTuKhoa   = !tuKhoa || (hs.hoTen || '').toLowerCase().includes(tuKhoa) || (hs.ma || '').toLowerCase().includes(tuKhoa);
      const hopLop      = !lopChon || String(hs.lopId || '') === String(lopChon);
      const hopTrangThai = !trangThai || String(hs.trangThaiId || '') === String(trangThai);
      return hopTuKhoa && hopLop && hopTrangThai;
    });

    if (ketQua.length === 0) {
      renderBang([]);
      hienPopup('Không tìm thấy học sinh phù hợp!');
    } else {
      renderBang(ketQua);
    }
  });
  nutDatLai.addEventListener('click', function () {
    inputTimKiem.value = '';
    selectLop.value    = '';
    selectTrangThai.value = '';
    hienThiLop.textContent = 'Chọn lớp';
    hienThiTrangThai.textContent = 'Chọn trạng thái';
    renderBang(danhSachHocSinh);
  });
  inputTimKiem.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') nutTimKiem.click();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && popup.classList.contains('hien')) anPopup();
  });

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

  async function xuLyDangXuat() {
    try {
      localStorage.removeItem('JIMS_TOKEN');
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include', headers: authHeaders() }).catch(() => null);
    } finally {
      window.location.href = '../AUT-02/aut02.html';
    }
  }

  if (nutDangXuatSidebar) {
    nutDangXuatSidebar.addEventListener('click', function (e) {
      e.preventDefault();
      hienPopupDangXuat();
    });
  }
  if (popupDXNutHuy) popupDXNutHuy.addEventListener('click', anPopupDangXuat);
  if (overlayDX) overlayDX.addEventListener('click', anPopupDangXuat);
  if (popupDXNutXacNhan) popupDXNutXacNhan.addEventListener('click', xuLyDangXuat);

  taiDanhSachLop();
  taiDanhSachTrangThai();
  taiDanhSachHocSinh();

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

  }

  if (window.JIMS && window.JIMS.ready) {
    window.JIMS.ready.then(function (role) {
      if (role) {
        runStu03();
      }
    });
  } else {
    (async function legacyShell() {
      try {
        const token = localStorage.getItem('JIMS_TOKEN');
        if (!token) {
          window.location.href = '../AUT-02/aut02.html';
          return;
        }
        const res = await fetch(`${API_BASE}/api/auth/session`, {
          method: 'GET',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok || !payload || !payload.success) {
          localStorage.removeItem('JIMS_TOKEN');
          window.location.href = '../AUT-02/aut02.html';
          return;
        }
        runStu03();
      } catch (e) {
        localStorage.removeItem('JIMS_TOKEN');
        window.location.href = '../AUT-02/aut02.html';
      }
    })();
  }
});