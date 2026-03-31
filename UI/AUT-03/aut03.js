document.addEventListener('DOMContentLoaded', function () {
  var API_BASE = 'http://127.0.0.1:8080';
  var LOGIN_URL = '../AUT-02/aut02.html';
  var POLICY_MSG =
    'Yêu cầu : Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ thường, chữ hoa, số và kí tự đặc biệt';
  var REGEX_MK_MANH = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
  var dangGui = false;
  var sessionHopLe = false;
  var seChuyenTrang = false;
  var daLuuLanDau = false;

  function authHeaders(extra) {
    var token = localStorage.getItem('JIMS_TOKEN');
    var base = extra ? Object.assign({}, extra) : {};
    if (token) base.Authorization = 'Bearer ' + token;
    return base;
  }

  function setThongBao(type, msg) {
    var tb = document.getElementById('thong-bao');
    if (!tb) return;
    tb.textContent = msg || '';
    tb.className = 'thong-bao';
    if (type === 'success') tb.classList.add('thanh-cong');
    if (type === 'error') tb.classList.add('loi');
  }

  function xoaThongBao() {
    var tb = document.getElementById('thong-bao');
    if (tb) {
      tb.textContent = '';
      tb.className = 'thong-bao';
    }
  }

  async function kiemTraSessionAut03() {
    try {
      var token = localStorage.getItem('JIMS_TOKEN');
      if (!token) {
        window.location.href = LOGIN_URL;
        sessionHopLe = false;
        return false;
      }
      var res = await fetch(API_BASE + '/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        headers: authHeaders()
      });
      var payload = await res.json().catch(function () {
        return null;
      });
      if (!res.ok || !payload || !payload.success) {
        localStorage.removeItem('JIMS_TOKEN');
        window.location.href = LOGIN_URL;
        sessionHopLe = false;
        return false;
      }
      sessionHopLe = true;
      return true;
    } catch (e) {
      localStorage.removeItem('JIMS_TOKEN');
      window.location.href = LOGIN_URL;
      sessionHopLe = false;
      return false;
    }
  }

  if (window.JIMS && window.JIMS.ready) {
    window.JIMS.ready.then(function (role) {
      if (role) {
        sessionHopLe = true;
      }
    });
  } else {
    kiemTraSessionAut03();
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

    if (loiId === 'loi-mk-moi') {
      var ghiChu = document.querySelector('.ghi-chu-mk');
      if (ghiChu) ghiChu.style.display = 'none';
    }
  }

  function xoaLoiTatCa() {
    ['loi-mk-hien-tai', 'loi-mk-moi', 'loi-mk-xac-nhan'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.textContent = '';
        el.classList.remove('hien');
      }
    });
    ['khung-mk-hien-tai', 'khung-mk-moi', 'khung-mk-xac-nhan'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('loi-input');
    });

    var ghiChu = document.querySelector('.ghi-chu-mk');
    if (ghiChu) ghiChu.style.display = '';
  }

  function xoaLoiMotTruong(loiId, khungId) {
    var loi = document.getElementById(loiId);
    var khung = document.getElementById(khungId);
    if (loi) {
      loi.textContent = '';
      loi.classList.remove('hien');
    }
    if (khung) khung.classList.remove('loi-input');
    if (loiId === 'loi-mk-moi') {
      var ghiChu = document.querySelector('.ghi-chu-mk');
      if (ghiChu) ghiChu.style.display = '';
    }
  }

  function layGiaTriTrim(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function validatePhiaClient() {
    var mkHienTai = layGiaTriTrim('mk-hien-tai');
    var mkMoi = layGiaTriTrim('mk-moi');
    var mkXacNhan = layGiaTriTrim('mk-xac-nhan');
    var hopLe = true;

    xoaLoiTatCa();
    xoaThongBao();

    if (!mkHienTai) {
      hienLoi('loi-mk-hien-tai', 'khung-mk-hien-tai', 'Mật khẩu hiện tại không được để trống!');
      hopLe = false;
    }

    if (!mkMoi) {
      hienLoi('loi-mk-moi', 'khung-mk-moi', POLICY_MSG);
      hopLe = false;
    } else if (!REGEX_MK_MANH.test(mkMoi)) {
      hienLoi('loi-mk-moi', 'khung-mk-moi', POLICY_MSG);
      hopLe = false;
    } else if (mkHienTai && mkMoi === mkHienTai) {
      hienLoi('loi-mk-moi', 'khung-mk-moi', 'Mật khẩu mới không được trùng với mật khẩu hiện tại');
      hopLe = false;
    }

    if (!mkXacNhan) {
      hienLoi('loi-mk-xac-nhan', 'khung-mk-xac-nhan', 'Xác nhận mật khẩu không được để trống');
      hopLe = false;
    } else if (mkMoi && mkXacNhan !== mkMoi) {
      hienLoi('loi-mk-xac-nhan', 'khung-mk-xac-nhan', 'Mật khẩu không khớp');
      hopLe = false;
    }

    return hopLe;
  }

  function togglePassword(inputId, btnId) {
    var input = document.getElementById(inputId);
    var btn = document.getElementById(btnId);
    if (!input || !btn) return;
    btn.addEventListener('click', function () {
      var isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.innerHTML = isHidden
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    });
  }

  togglePassword('mk-hien-tai', 'toggle-mk-hien-tai');
  togglePassword('mk-moi', 'toggle-mk-moi');
  togglePassword('mk-xac-nhan', 'toggle-mk-xac-nhan');

  var inpHienTai = document.getElementById('mk-hien-tai');
  var inpMoi = document.getElementById('mk-moi');
  var inpXacNhan = document.getElementById('mk-xac-nhan');
  if (inpHienTai) {
    inpHienTai.addEventListener('input', function () {
      if (!daLuuLanDau) {
        xoaLoiMotTruong('loi-mk-hien-tai', 'khung-mk-hien-tai');
      } else {
        validatePhiaClient();
      }
    });
  }
  if (inpMoi) {
    inpMoi.addEventListener('input', function () {
      if (!daLuuLanDau) {
        xoaLoiMotTruong('loi-mk-moi', 'khung-mk-moi');
      } else {
        validatePhiaClient();
      }
    });
  }
  if (inpXacNhan) {
    inpXacNhan.addEventListener('input', function () {
      if (!daLuuLanDau) {
        xoaLoiMotTruong('loi-mk-xac-nhan', 'khung-mk-xac-nhan');
      } else {
        validatePhiaClient();
      }
    });
  }

  var nutHuy = document.getElementById('nut-huy');
  if (nutHuy) {
    nutHuy.addEventListener('click', function () {
      if (dangGui) return;
      xoaLoiTatCa();
      xoaThongBao();
      var i1 = document.getElementById('mk-hien-tai');
      var i2 = document.getElementById('mk-moi');
      var i3 = document.getElementById('mk-xac-nhan');
      if (i1) i1.value = '';
      if (i2) i2.value = '';
      if (i3) i3.value = '';
      daLuuLanDau = false;
    });
  }

  function apLoiTuServer(msg) {
    xoaLoiTatCa();
    if (!msg) {
      setThongBao('error', 'Lỗi hệ thống. Vui lòng thử lại sau.');
      return;
    }
    if (msg.indexOf('Mật khẩu hiện tại không được để trống') !== -1 || msg.indexOf('không chính xác') !== -1) {
      hienLoi('loi-mk-hien-tai', 'khung-mk-hien-tai', msg);
      return;
    }
    if (msg.indexOf('Yêu cầu') !== -1 || msg.indexOf('trùng với mật khẩu hiện tại') !== -1) {
      hienLoi('loi-mk-moi', 'khung-mk-moi', msg);
      return;
    }
    if (msg.indexOf('Xác nhận mật khẩu không được để trống') !== -1 || msg.indexOf('không khớp') !== -1) {
      hienLoi('loi-mk-xac-nhan', 'khung-mk-xac-nhan', msg);
      return;
    }
    if (msg.indexOf('quá dài') !== -1) {
      setThongBao('error', msg);
      return;
    }
    setThongBao('error', msg);
  }

  function hienPopupThanhCong() {
    var ov = document.getElementById('overlay-thanh-cong-mk');
    var pop = document.getElementById('popup-thanh-cong-mk');
    if (ov) ov.style.display = 'block';
    if (pop) pop.style.display = 'block';
  }

  function anPopupThanhCong() {
    var ov = document.getElementById('overlay-thanh-cong-mk');
    var pop = document.getElementById('popup-thanh-cong-mk');
    if (ov) ov.style.display = 'none';
    if (pop) pop.style.display = 'none';
  }

  function hoanTatDangXuatSauDoiMk() {
    var sid = window.JIMS && window.JIMS.staffId != null ? window.JIMS.staffId : null;
    if (sid != null && window.JIMS && typeof window.JIMS.setupDoneKey === 'function') {
      try {
        localStorage.setItem(window.JIMS.setupDoneKey(sid), '1');
      } catch (e) {}
    }
    var headersLogout = authHeaders({ 'Content-Type': 'application/json' });
    localStorage.removeItem('JIMS_TOKEN');
    sessionHopLe = false;
    fetch(API_BASE + '/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: headersLogout
    })
      .catch(function () {
        return null;
      })
      .finally(function () {
        anPopupThanhCong();
        window.location.href = LOGIN_URL;
      });
  }

  var btnOkThanhCong = document.getElementById('popup-thanh-cong-mk-ok');
  if (btnOkThanhCong) {
    btnOkThanhCong.addEventListener('click', hoanTatDangXuatSauDoiMk);
  }

  var nutLuu = document.getElementById('nut-luu');
  if (nutLuu) {
    nutLuu.addEventListener('click', async function () {
      if (dangGui) return;
      if (!sessionHopLe) {
        var ok = await kiemTraSessionAut03();
        if (!ok) return;
      }

      daLuuLanDau = true;
      if (!validatePhiaClient()) return;

      seChuyenTrang = false;
      dangGui = true;
      nutLuu.disabled = true;
      nutLuu.textContent = 'Đang lưu...';
      xoaThongBao();

      var mkHienTai = layGiaTriTrim('mk-hien-tai');
      var mkMoi = layGiaTriTrim('mk-moi');
      var mkXacNhan = layGiaTriTrim('mk-xac-nhan');

      try {
        var res = await fetch(API_BASE + '/api/auth/change-password', {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({
            currentPassword: mkHienTai,
            newPassword: mkMoi,
            confirmPassword: mkXacNhan
          })
        });

        var payload = await res.json().catch(function () {
          return null;
        });
        var success = !!(payload && payload.success);
        var message = payload && payload.message ? String(payload.message) : '';

        if (res.status === 401) {
          localStorage.removeItem('JIMS_TOKEN');
          window.location.href = LOGIN_URL;
          return;
        }

        if (!success) {
          if (res.status >= 500) {
            setThongBao('error', 'Lỗi hệ thống. Vui lòng thử lại sau.');
          } else {
            apLoiTuServer(message);
          }
          return;
        }

        seChuyenTrang = true;
        nutLuu.textContent = 'Đang lưu...';
        hienPopupThanhCong();
      } catch (e) {
        setThongBao('error', 'Không thể kết nối server. Hãy kiểm tra backend đang chạy.');
      } finally {
        if (!seChuyenTrang) {
          nutLuu.disabled = false;
          nutLuu.textContent = 'Lưu';
          dangGui = false;
        }
      }
    });
  }

  var menuThongTin = document.getElementById('menu-thong-tin');
  var menuMatKhau = document.getElementById('menu-mat-khau');
  if (menuThongTin) {
    menuThongTin.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelectorAll('.sub-menu-item').forEach(function (el) {
        el.classList.remove('active');
      });
      this.classList.add('active');
    });
  }
  if (menuMatKhau) {
    menuMatKhau.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelectorAll('.sub-menu-item').forEach(function (el) {
        el.classList.remove('active');
      });
      this.classList.add('active');
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

  var logoutBtn = document.getElementById('sidebar-logout');
  var overlayDX = document.getElementById('overlay-dang-xuat');
  var popupDX = document.getElementById('popup-dang-xuat');

  function hienPopupDangXuat() {
    if (overlayDX) overlayDX.style.display = 'block';
    if (popupDX) popupDX.style.display = 'block';
  }

  function anPopupDangXuat() {
    if (overlayDX) overlayDX.style.display = 'none';
    if (popupDX) popupDX.style.display = 'none';
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      hienPopupDangXuat();
    });
  }

  var btnHuyDX = document.getElementById('popup-dx-huy');
  if (btnHuyDX) {
    btnHuyDX.addEventListener('click', anPopupDangXuat);
  }

  if (overlayDX) {
    overlayDX.addEventListener('click', anPopupDangXuat);
  }

  var btnXacNhanDX = document.getElementById('popup-dx-xac-nhan');
  if (btnXacNhanDX) {
    btnXacNhanDX.addEventListener('click', function () {
      localStorage.removeItem('JIMS_TOKEN');
      window.location.href = LOGIN_URL;
    });
  }
});
