document.addEventListener('DOMContentLoaded', function () {
  var API_BASE = (window.JIMS && window.JIMS.API_BASE) ? window.JIMS.API_BASE : 'http://127.0.0.1:8080';
  var LOGIN_URL = '../AUT-02/aut02.html';

  var dangGui = false;
  var sessionHopLe = false;
  var sessionDangXuLy = false;

  function authHeaders(extra) {
    if (window.JIMS && typeof window.JIMS.authHeaders === 'function') {
      var base = window.JIMS.authHeaders();
      return extra ? Object.assign(base, extra) : base;
    }
    var token = localStorage.getItem('JIMS_TOKEN');
    var h = extra ? Object.assign({}, extra) : {};
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
  }

  function hienThongBaoDangNhapHetHan() {
    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  function getNetworkFailureMessage() {
    if (!navigator.onLine) {
      return 'Mất kết nối internet. Vui lòng kiểm tra mạng.';
    }
    return 'Không thể kết nối hệ thống. Vui lòng thử lại sau.';
  }

  async function kiemTraSessionOpe01() {
    try {
      var token = localStorage.getItem('JIMS_TOKEN');
      if (!token) {
        hienThongBaoDangNhapHetHan();
        window.location.href = LOGIN_URL;
        sessionHopLe = false;
        return false;
      }

      sessionDangXuLy = true;
      var res = await fetch(API_BASE + '/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        headers: authHeaders()
      });
      var payload = await res.json().catch(function () { return null; });
      if (res.status === 401 || !payload || !payload.success) {
        localStorage.removeItem('JIMS_TOKEN');
        hienThongBaoDangNhapHetHan();
        window.location.href = LOGIN_URL;
        sessionHopLe = false;
        return false;
      }
      sessionHopLe = true;
      var role = payload && payload.data && payload.data.role ? String(payload.data.role) : '';
      if (role && role.toLowerCase() !== 'admin') {
        alert('Bạn không có quyền truy cập!');
        window.location.href = '../STU-03/stu03.html';
        return false;
      }
      return true;
    } catch (e) {
      localStorage.removeItem('JIMS_TOKEN');
      alert(getNetworkFailureMessage());
      sessionHopLe = false;
      return false;
    }
    finally {
      sessionDangXuLy = false;
    }
  }

  if (window.JIMS && window.JIMS.ready) {
    window.JIMS.ready.then(function (role) {
      if (role) sessionHopLe = true;
    });
  }

  function hienLoi(loiId, khungId, msg) {
    msg = msg == null ? '' : String(msg).trim();
    var loi = document.getElementById(loiId);
    var khung = document.getElementById(khungId);
    if (loi) {
      loi.textContent = msg;
      loi.classList.add('hien');
    }
    if (khung) khung.classList.add('loi-input');
  }

  function xoaLoiTatCa() {
    document.querySelectorAll('.loi-text').forEach(function (el) {
      el.textContent = '';
      el.classList.remove('hien');
    });
    document.querySelectorAll('.khung-input, .khung-select').forEach(function (el) {
      el.classList.remove('loi-input');
    });
  }

  function xoaLoiMotTruong(loiId, khungId) {
    var loi = document.getElementById(loiId);
    var khung = document.getElementById(khungId);
    if (loi) {
      loi.textContent = '';
      loi.classList.remove('hien');
    }
    if (khung) khung.classList.remove('loi-input');
  }

  function isBlank(s) {
    return s == null || String(s).trim() === '';
  }

  function normalizeClassName(raw) {
    var s = raw == null ? '' : String(raw);
    s = s.trim();
    if (!s) return '';
    return s.toUpperCase();
  }

  function parseDdMmYyyyToIso(s) {
    var str = s == null ? '' : String(s).trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return null;
    var parts = str.split('/');
    var dd = parseInt(parts[0], 10);
    var mm = parseInt(parts[1], 10);
    var yyyy = parseInt(parts[2], 10);
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return null;
    var d = new Date(yyyy, mm - 1, dd);
    if (d.getFullYear() !== yyyy || d.getMonth() !== (mm - 1) || d.getDate() !== dd) return null;
    var mm2 = String(mm).padStart(2, '0');
    var dd2 = String(dd).padStart(2, '0');
    return yyyy + '-' + mm2 + '-' + dd2;
  }

  function timeToMinutes(timeStr) {
    if (!timeStr) return null;
    var parts = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
    if (!parts) return null;
    var h = parseInt(parts[1], 10);
    var m = parseInt(parts[2], 10);
    if (isNaN(h) || isNaN(m) || m < 0 || m > 59) return null;
    var ampm = parts[3] ? String(parts[3]).toUpperCase() : '';
    if (ampm) {
      if (h < 1 || h > 12) return null;
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
    } else {
      if (h < 0 || h > 23) return null;
    }
    return h * 60 + m;
  }

  function minutesToHHmm(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function handleDateInput(e) {
    var value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 4) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4);
    } else if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    e.target.value = value;
  }

  function handleTimeInput(e) {
    var value = e.target.value.replace(/[^0-9:amp\s]/gi, '');
    var timeMatch = value.match(/^[0-9:]+/);
    var timePart = timeMatch ? timeMatch[0] : '';
    var ampmPart = timeMatch ? value.slice(timePart.length) : value;

    if (timePart) {
      var colons = timePart.split(':').length - 1;
      if (colons > 1) {
        var firstColon = timePart.indexOf(':');
        timePart = timePart.slice(0, firstColon + 1) + timePart.slice(firstColon + 1).replace(/:/g, '');
      }

      var p = timePart.split(':');
      if (p.length === 1 && timePart.length >= 3) {
        var firstDigit = parseInt(timePart[0], 10);
        var secondDigit = parseInt(timePart[1], 10);
        if (firstDigit >= 3 || (firstDigit === 2 && secondDigit >= 4)) {
          timePart = timePart.slice(0, 1) + ':' + timePart.slice(1);
        } else {
          timePart = timePart.slice(0, 2) + ':' + timePart.slice(2);
        }
        p = timePart.split(':');
      }

      if (p.length === 2) {
        if (p[0].length > 2) p[0] = p[0].slice(0, 2);
        if (p[1].length > 2) p[1] = p[1].slice(0, 2);
        timePart = p.join(':');
      } else if (p.length === 1 && p[0].length > 4) {
        timePart = p[0].slice(0, 4);
      }
    }

    if (ampmPart) {
      ampmPart = ampmPart.replace(/[^amp\s]/gi, '').toUpperCase();
      if (ampmPart.length > 3) ampmPart = ampmPart.slice(0, 3);
      ampmPart = ampmPart.replace(/\s+/g, ' ').trim();
      if (ampmPart && ampmPart !== 'AM' && ampmPart !== 'PM') {
        if (ampmPart.indexOf('A') === 0) ampmPart = 'AM';
        else if (ampmPart.indexOf('P') === 0) ampmPart = 'PM';
      }
      if (ampmPart) ampmPart = ' ' + ampmPart;
    }

    e.target.value = timePart + ampmPart;
  }

  function vndText(amount) {
    if (amount == null || amount === '') return '';
    var n = Number(amount);
    if (isNaN(n)) return '';
    return new Intl.NumberFormat('vi-VN').format(n) + ' VND';
  }

  var selectCapDo = document.getElementById('cap-do');
  var hienThiCapDo = document.getElementById('hien-thi-cap-do');
  var selectGiaoVien = document.getElementById('giao-vien');
  var hienThiGiaoVien = document.getElementById('hien-thi-giao-vien');
  var inputHocPhi = document.getElementById('hoc-phi');
  var inputNgay = document.getElementById('ngay-khai-giang');
  var inputGioBatDau = document.getElementById('gio-bat-dau');
  var inputGioKetThuc = document.getElementById('gio-ket-thuc');
  var inputTenLop = document.getElementById('ten-lop');
  var inputSoLuong = document.getElementById('so-luong-hs');
  var nutLuu = document.getElementById('nut-luu');
  var nutHuy = document.getElementById('nut-huy');

  // Prevent submit spam before session check completes.
  if (nutLuu) nutLuu.disabled = true;

  if (inputNgay) inputNgay.addEventListener('input', handleDateInput);
  if (inputGioBatDau) inputGioBatDau.addEventListener('input', handleTimeInput);
  if (inputGioKetThuc) inputGioKetThuc.addEventListener('input', handleTimeInput);

  if (inputTenLop) {
    inputTenLop.addEventListener('input', function () {
      xoaLoiMotTruong('loi-ten-lop', 'khung-ten-lop');
    });
    inputTenLop.addEventListener('blur', function () {
      var v = normalizeClassName(inputTenLop.value);
      inputTenLop.value = v;
    });
  }
  if (inputSoLuong) inputSoLuong.addEventListener('input', function () { xoaLoiMotTruong('loi-so-luong-hs', 'khung-so-luong-hs'); });
  if (inputNgay) inputNgay.addEventListener('input', function () { xoaLoiMotTruong('loi-ngay-khai-giang', 'khung-ngay-khai-giang'); });
  if (inputGioBatDau) inputGioBatDau.addEventListener('input', function () { xoaLoiMotTruong('loi-gio-hoc', 'khung-gio-bat-dau'); xoaLoiMotTruong('loi-gio-hoc', 'khung-gio-ket-thuc'); });
  if (inputGioKetThuc) inputGioKetThuc.addEventListener('input', function () { xoaLoiMotTruong('loi-gio-hoc', 'khung-gio-bat-dau'); xoaLoiMotTruong('loi-gio-hoc', 'khung-gio-ket-thuc'); });

  document.querySelectorAll('.checkbox-ngay').forEach(function (cb) {
    cb.addEventListener('change', function () {
      var checked = document.querySelectorAll('.checkbox-ngay:checked').length;
      if (checked <= 2) {
        document.getElementById('loi-lich-hoc').textContent = '';
        document.getElementById('loi-lich-hoc').classList.remove('hien');
      } else {
        this.checked = false;
      }
    });
  });

  function getLessonDays() {
    var days = [];
    document.querySelectorAll('.checkbox-ngay:checked').forEach(function (cb) {
      days.push(String(cb.value));
    });
    return days;
  }

  function validateClient() {
    xoaLoiTatCa();
    var hopLe = true;

    var className = normalizeClassName(inputTenLop ? inputTenLop.value : '');
    if (!className) {
      hienLoi('loi-ten-lop', 'khung-ten-lop', 'Mục này không được để trống!');
      hopLe = false;
    } else if (className.length > 10) {
      hienLoi('loi-ten-lop', 'khung-ten-lop', 'Tên lớp học cần ít hơn 10 ký tự');
      hopLe = false;
    }

    if (!selectCapDo || !selectCapDo.value) {
      hienLoi('loi-cap-do', 'khung-cap-do', 'Mục này không được để trống!');
      hopLe = false;
    }

    if (!selectGiaoVien || !selectGiaoVien.value) {
      hienLoi('loi-giao-vien', 'khung-giao-vien', 'Mục này không được để trống!');
      hopLe = false;
    }

    var startDateIso = parseDdMmYyyyToIso(inputNgay ? inputNgay.value : '');
    if (!startDateIso) {
      hienLoi('loi-ngay-khai-giang', 'khung-ngay-khai-giang', 'Ngày khai giảng không hợp lệ!');
      hopLe = false;
    }

    // Fixed business rule: 15
    var cap = 15;

    var days = getLessonDays();
    if (days.length !== 2) {
      var loiLich = document.getElementById('loi-lich-hoc');
      if (loiLich) {
        loiLich.textContent = 'Vui lòng chọn 2 ngày học!';
        loiLich.classList.add('hien');
      }
      hopLe = false;
    }

    var startMins = timeToMinutes(inputGioBatDau ? inputGioBatDau.value : '');
    var endMins = timeToMinutes(inputGioKetThuc ? inputGioKetThuc.value : '');
    if (startMins == null || endMins == null) {
      hienLoi('loi-gio-hoc', 'khung-gio-bat-dau', 'Khung giờ học không hợp lệ!');
      hienLoi('loi-gio-hoc', 'khung-gio-ket-thuc', 'Khung giờ học không hợp lệ!');
      hopLe = false;
    } else if (endMins <= startMins) {
      hienLoi('loi-gio-hoc', 'khung-gio-bat-dau', 'Khung giờ học không hợp lệ!');
      hienLoi('loi-gio-hoc', 'khung-gio-ket-thuc', 'Khung giờ học không hợp lệ!');
      hopLe = false;
    } else if ((endMins - startMins) < 30) {
      hienLoi('loi-gio-hoc', 'khung-gio-bat-dau', 'Thời lượng buổi học phải tối thiểu 30 phút.');
      hienLoi('loi-gio-hoc', 'khung-gio-ket-thuc', 'Thời lượng buổi học phải tối thiểu 30 phút.');
      hopLe = false;
    }

    return hopLe;
  }

  function hienPopupLuuThanhCong(msg) {
    var overlay = document.getElementById('overlay');
    var popup = document.getElementById('popup');
    var popupNoiDung = document.getElementById('popup-noi-dung');
    if (popupNoiDung) popupNoiDung.textContent = msg || 'Lớp học đã được lưu thành công!';
    if (overlay) overlay.style.display = 'block';
    if (popup) popup.style.display = 'block';
  }

  function dongPopupLuu() {
    var overlay = document.getElementById('overlay');
    var popup = document.getElementById('popup');
    if (overlay) overlay.style.display = 'none';
    if (popup) popup.style.display = 'none';
    if (nutHuy) nutHuy.click();
  }

  var btnDong = document.getElementById('popup-nut-dong');
  if (btnDong) btnDong.addEventListener('click', dongPopupLuu);
  var overlaySave = document.getElementById('overlay');
  if (overlaySave) overlaySave.addEventListener('click', function (e) { if (e.target === overlaySave) dongPopupLuu(); });

  function resetForm() {
    if (inputTenLop) inputTenLop.value = '';
    if (selectCapDo) selectCapDo.value = '';
    if (selectGiaoVien) selectGiaoVien.value = '';
    if (inputHocPhi) inputHocPhi.value = '';
    if (hienThiCapDo) hienThiCapDo.textContent = '-- Chọn cấp độ --';
    if (hienThiGiaoVien) hienThiGiaoVien.textContent = '-- Chọn giáo viên --';
    if (inputNgay) inputNgay.value = '';
    if (inputSoLuong) inputSoLuong.value = '';
    document.querySelectorAll('.checkbox-ngay').forEach(function (cb) { cb.checked = false; });
    if (inputGioBatDau) inputGioBatDau.value = '';
    if (inputGioKetThuc) inputGioKetThuc.value = '';
    xoaLoiTatCa();
  }

  if (nutHuy) {
    nutHuy.addEventListener('click', function () {
      if (dangGui) return;
      resetForm();
    });
  }

  async function taiLevels() {
    var res = await fetch(API_BASE + '/api/levels', { credentials: 'include', headers: authHeaders() });
    var payload = await res.json().catch(function () { return null; });
    if (res.status === 401) throw { code: 401 };
    if (!payload || !payload.success || !Array.isArray(payload.data)) throw new Error('levels');
    return payload.data;
  }

  async function taiTeachers() {
    var res = await fetch(API_BASE + '/api/staff/teachers', { credentials: 'include', headers: authHeaders() });
    var payload = await res.json().catch(function () { return null; });
    if (res.status === 401) throw { code: 401 };
    if (!payload || !payload.success || !Array.isArray(payload.data)) throw new Error('teachers');
    return payload.data;
  }

  function capNhatHienThiSelect(selectEl, labelEl) {
    if (!selectEl || !labelEl) return;
    labelEl.textContent = selectEl.value ? selectEl.options[selectEl.selectedIndex].text : labelEl.getAttribute('data-default') || labelEl.textContent;
  }

  async function initDropdowns() {
    var levels = await taiLevels();
    var teachers = await taiTeachers();

    if (selectCapDo) {
      selectCapDo.innerHTML = '<option value="">-- Chọn cấp độ --</option>';
      levels.forEach(function (l) {
        var opt = document.createElement('option');
        opt.value = String(l.levelId);
        opt.textContent = String(l.levelName);
        opt.setAttribute('data-price', l.pricePerSession != null ? String(l.pricePerSession) : '');
        selectCapDo.appendChild(opt);
      });
      if (hienThiCapDo) {
        hienThiCapDo.setAttribute('data-default', '-- Chọn cấp độ --');
        capNhatHienThiSelect(selectCapDo, hienThiCapDo);
      }
      selectCapDo.addEventListener('change', function () {
        capNhatHienThiSelect(selectCapDo, hienThiCapDo);
        xoaLoiMotTruong('loi-cap-do', 'khung-cap-do');
        if (inputHocPhi) {
          var price = this.options[this.selectedIndex] ? this.options[this.selectedIndex].getAttribute('data-price') : '';
          inputHocPhi.value = price ? vndText(price) : '';
        }
      });
    }

    if (selectGiaoVien) {
      selectGiaoVien.innerHTML = '<option value="">-- Chọn giáo viên --</option>';
      teachers.forEach(function (t) {
        var opt2 = document.createElement('option');
        opt2.value = String(t.staffId);
        opt2.textContent = String(t.fullName);
        selectGiaoVien.appendChild(opt2);
      });
      if (hienThiGiaoVien) {
        hienThiGiaoVien.setAttribute('data-default', '-- Chọn giáo viên --');
        capNhatHienThiSelect(selectGiaoVien, hienThiGiaoVien);
      }
      selectGiaoVien.addEventListener('change', function () {
        capNhatHienThiSelect(selectGiaoVien, hienThiGiaoVien);
        xoaLoiMotTruong('loi-giao-vien', 'khung-giao-vien');
      });
    }
  }

  function apLoiServer(message) {
    var msg = message ? String(message) : '';
    if (!msg) return;
    if (msg.indexOf('Tên lớp') !== -1) {
      hienLoi('loi-ten-lop', 'khung-ten-lop', msg);
      return;
    }
    if (msg.indexOf('Số lượng học sinh') !== -1 || msg.indexOf('Sức chứa') !== -1) {
      hienLoi('loi-so-luong-hs', 'khung-so-luong-hs', msg);
      return;
    }
    if (msg.indexOf('Ngày') !== -1) {
      hienLoi('loi-ngay-khai-giang', 'khung-ngay-khai-giang', msg);
      return;
    }
    if (msg.indexOf('Giờ') !== -1 || msg.indexOf('Khung giờ') !== -1) {
      hienLoi('loi-gio-hoc', 'khung-gio-bat-dau', msg);
      hienLoi('loi-gio-hoc', 'khung-gio-ket-thuc', msg);
      return;
    }
    if (msg.indexOf('Ngày học') !== -1 || msg.indexOf('2 buổi') !== -1) {
      var loiLich = document.getElementById('loi-lich-hoc');
      if (loiLich) {
        loiLich.textContent = msg;
        loiLich.classList.add('hien');
      }
      return;
    }
    if (msg.indexOf('Giáo viên') !== -1) {
      hienLoi('loi-giao-vien', 'khung-giao-vien', msg);
      return;
    }
    if (msg.indexOf('Cấp độ') !== -1 || msg.indexOf('level') !== -1) {
      hienLoi('loi-cap-do', 'khung-cap-do', msg);
      return;
    }
    alert(msg);
  }

  async function submit() {
    if (dangGui) return;
    if (!sessionHopLe) return;

    var isValid = validateClient();
    if (!isValid) return;

    var className = normalizeClassName(inputTenLop.value);
    var levelId = parseInt(selectCapDo.value, 10);
    var teacherId = parseInt(selectGiaoVien.value, 10);
    var startDateIso = parseDdMmYyyyToIso(inputNgay.value);
    var capacity = 15;
    var days = getLessonDays();
    var startMins = timeToMinutes(inputGioBatDau.value);
    var endMins = timeToMinutes(inputGioKetThuc.value);

    dangGui = true;
    if (nutLuu) {
      nutLuu.disabled = true;
      nutLuu.textContent = 'Đang lưu...';
    }

    try {
      var res = await fetch(API_BASE + '/api/classes', {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          className: className,
          levelId: levelId,
          teacherId: teacherId,
          startDate: startDateIso,
          capacity: capacity,
          days: days,
          startTime: minutesToHHmm(startMins),
          endTime: minutesToHHmm(endMins)
        })
      });

      var payload = await res.json().catch(function () { return null; });

      if (res.status === 401) {
        localStorage.removeItem('JIMS_TOKEN');
        hienThongBaoDangNhapHetHan();
        window.location.href = LOGIN_URL;
        return;
      }

      if (!payload || !payload.success) {
        if (res.status >= 500) {
          alert(getNetworkFailureMessage());
        } else {
          apLoiServer(payload && payload.message ? payload.message : 'Dữ liệu không hợp lệ.');
        }
        return;
      }

      hienPopupLuuThanhCong('Lớp học đã được lưu thành công!');
    } catch (e) {
      alert(getNetworkFailureMessage());
    } finally {
      if (nutLuu) {
        nutLuu.disabled = false;
        nutLuu.textContent = 'Lưu';
      }
      dangGui = false;
    }
  }

  if (nutLuu) nutLuu.addEventListener('click', submit);

  function hienPopupDangXuat() {
    var overlayDX = document.getElementById('overlay-dang-xuat');
    var popupDX = document.getElementById('popup-dang-xuat');
    if (overlayDX) overlayDX.style.display = 'block';
    if (popupDX) popupDX.style.display = 'block';
    document.body.classList.add('popup-open');
    document.body.style.overflow = 'hidden';
    document.body.classList.remove('mobile-sidebar-open');
  }

  function anPopupDangXuat() {
    var overlayDX = document.getElementById('overlay-dang-xuat');
    var popupDX = document.getElementById('popup-dang-xuat');
    if (overlayDX) overlayDX.style.display = 'none';
    if (popupDX) popupDX.style.display = 'none';
    document.body.classList.remove('popup-open');
    document.body.style.overflow = '';
  }

  var logoutBtn = document.getElementById('sidebar-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', function (e) { e.preventDefault(); hienPopupDangXuat(); });

  var btnHuyDX = document.getElementById('popup-dx-huy');
  if (btnHuyDX) btnHuyDX.addEventListener('click', anPopupDangXuat);
  var overlayDX = document.getElementById('overlay-dang-xuat');
  if (overlayDX) overlayDX.addEventListener('click', anPopupDangXuat);

  var btnXacNhanDX = document.getElementById('popup-dx-xac-nhan');
  if (btnXacNhanDX) {
    btnXacNhanDX.addEventListener('click', function () {
      localStorage.removeItem('JIMS_TOKEN');
      fetch(API_BASE + '/api/auth/logout', { method: 'POST', credentials: 'include', headers: authHeaders() })
        .catch(function () { return null; })
        .finally(function () { window.location.href = LOGIN_URL; });
    });
  }

  var mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  var mobileSidebarBackdrop = document.getElementById('mobile-sidebar-backdrop');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function () {
      document.body.classList.toggle('mobile-sidebar-open');
    });
  }
  if (mobileSidebarBackdrop) {
    mobileSidebarBackdrop.addEventListener('click', function () {
      document.body.classList.remove('mobile-sidebar-open');
    });
  }
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 768) {
      document.body.classList.remove('mobile-sidebar-open');
    }
  });

  var navDanhSach = document.getElementById('nav-danh-sach-lop');
  if (navDanhSach) {
    navDanhSach.addEventListener('click', function (e) {
      try {
        e.preventDefault();
        window.location.href = '../OPE-02/ope02.html';
      } catch (_) {
        window.location.href = '../OPE-02/ope02.html';
      }
    });
  }

  (async function init() {
    try {
      if (window.JIMS && window.JIMS.ready) {
        var role = await window.JIMS.ready;
        if (!role) return;
        sessionHopLe = true;
      } else if (!sessionHopLe) {
        var ok = await kiemTraSessionOpe01();
        if (!ok) return;
      }
      if (nutLuu) nutLuu.disabled = false;
      await initDropdowns();
    } catch (e) {
      if (e && e.code === 401) {
        localStorage.removeItem('JIMS_TOKEN');
        hienThongBaoDangNhapHetHan();
        window.location.href = LOGIN_URL;
        return;
      }
      alert(getNetworkFailureMessage());
    }
  })();
});
