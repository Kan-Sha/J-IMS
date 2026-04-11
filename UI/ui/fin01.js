import { fetchClasses, fetchClassStudentsForInvoice, createInvoice, fetchClassStudentCount } from '../api/invoiceService.js';
import { formatCurrency, parseCurrency, isFeeWithinLimit } from '../utils/validation.js';
import { generateBillingCycles, billingPeriodToLabel } from '../utils/billing.js';
import { renderPaginationBar } from '../utils/pagination.js';

document.addEventListener('DOMContentLoaded', function () {
  let allClasses = [];
  let currentClass = null;
  let currentMonth = '';
  let currentTotalSessions = 16;
  let currentUnitPrice = 0;
  let currentStudentsPayload = null;

  let classListPage = 1;
  const CLASS_LIST_PAGE_SIZE = 8;
  let previewPage = 1;
  const PREVIEW_PAGE_SIZE = 6;
  let previewLineById = {};
  let previewOrder = [];

  const tbodyDanhSach = document.getElementById('tbody-danh-sach-lop');
  const tbodyXemTruoc = document.getElementById('tbody-xem-truoc');
  const phanTrangDanhSach = document.getElementById('phan-trang-fin01-danh-sach');
  const phanTrangDanhSachInfo = document.getElementById('phan-trang-fin01-danh-sach-info');
  const phanTrangDanhSachNav = document.getElementById('phan-trang-fin01-danh-sach-nav');
  const phanTrangXemTruoc = document.getElementById('phan-trang-fin01-xem-truoc');
  const phanTrangXemTruocInfo = document.getElementById('phan-trang-fin01-xem-truoc-info');
  const phanTrangXemTruocNav = document.getElementById('phan-trang-fin01-xem-truoc-nav');
  const errKy = document.getElementById('err-cau-hinh-ky');
  const errBuoi = document.getElementById('err-cau-hinh-buoi');
  const errTongQuat = document.getElementById('err-luu-tong-quat');
  const popupOverlay = document.getElementById('overlay-thanh-cong');
  const popupBox = document.getElementById('popup-thanh-cong');
  const popupText = document.getElementById('popup-txt-thanh-cong');
  const selKyThanhToan = document.getElementById('sel-ky-thanh-toan');
  const lblKyThanhToan = document.getElementById('hien-thi-ky-thanh-toan');

  function defaultBillingPeriodForYear(year) {
    var month = new Date().getMonth() + 1;
    var startMonth = month % 2 === 0 ? month - 1 : month;
    if (startMonth < 1) startMonth = 1;
    if (startMonth > 11) startMonth = 11;
    return String(year) + '-' + String(startMonth).padStart(2, '0');
  }

  function renderBillingCycles() {
    var currentYear = new Date().getFullYear();
    var cycles = generateBillingCycles(currentYear, 2);
    selKyThanhToan.innerHTML = '';
    cycles.forEach(function (item) {
      var opt = document.createElement('option');
      opt.value = item.value;
      opt.textContent = item.label;
      selKyThanhToan.appendChild(opt);
    });
    var selected = currentMonth && cycles.some(function (c) { return c.value === currentMonth; })
      ? currentMonth
      : defaultBillingPeriodForYear(currentYear);
    currentMonth = selected;
    selKyThanhToan.value = selected;
    var selectedOption = selKyThanhToan.options[selKyThanhToan.selectedIndex];
    lblKyThanhToan.innerText = selectedOption ? selectedOption.text : '';
  }

  function showPopup(msg) {
    if (popupText) popupText.textContent = msg;
    if (popupOverlay) popupOverlay.style.display = 'block';
    if (popupBox) popupBox.style.display = 'block';
  }

  function hidePopup() {
    if (popupOverlay) popupOverlay.style.display = 'none';
    if (popupBox) popupBox.style.display = 'none';
  }

  function backFin01() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = '../FIN-02/fin02.html';
  }
  var btnBack = document.getElementById('btn-back-fin01');
  if (btnBack) {
    btnBack.addEventListener('click', function (e) {
      e.preventDefault();
      backFin01();
    });
  }

  function parseStateFromUrl() {
    var p = new URLSearchParams(window.location.search || '');
    return {
      view: p.get('view') || 'list',
      classId: p.get('classId') ? parseInt(p.get('classId'), 10) : null,
      billingPeriod: p.get('billingPeriod') || '',
      totalSessions: p.get('totalSessions') ? parseInt(p.get('totalSessions'), 10) : null
    };
  }

  function syncUrl(viewName, mode) {
    var p = new URLSearchParams();
    p.set('view', viewName);
    if (currentClass && currentClass.id != null) p.set('classId', String(currentClass.id));
    if (currentMonth) p.set('billingPeriod', currentMonth);
    if (currentTotalSessions) p.set('totalSessions', String(currentTotalSessions));
    var next = window.location.pathname + '?' + p.toString();
    var state = { view: viewName, classId: currentClass ? currentClass.id : null, billingPeriod: currentMonth, totalSessions: currentTotalSessions };
    if (mode === 'replace') window.history.replaceState(state, '', next);
    else if (mode === 'push') window.history.pushState(state, '', next);
  }

  function switchView(viewId) {
    ['view-danh-sach', 'view-cau-hinh', 'view-xem-truoc'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = (id === viewId) ? 'block' : 'none';
    });
  }

  async function loadClasses(keyword) {
    try {
      const rows = await fetchClasses(keyword || '');
      allClasses = await Promise.all((rows || []).map(async function (r) {
        var cls = {
          id: r.classId,
          lop: r.className,
          trinhDo: r.levelName,
          siSo: String(r.currentSize || 0) + '/' + String(r.capacity || 0),
          tuitionPerSession: (r.tuitionPerSession || r.pricePerSession || 0)
        };
        try {
          var cnt = await fetchClassStudentCount(r.classId);
          cls.siSo = String(cnt.currentSize || 0) + '/' + String(cnt.capacity || 0);
        } catch (ignore) {
        }
        return cls;
      }));
      classListPage = 1;
      renderClasses(allClasses);
    } catch (e) {
      tbodyDanhSach.innerHTML = '<tr><td colspan="5">Không tải được danh sách lớp</td></tr>';
    }
  }

  function renderClassListPagination(totalItems) {
    if (!phanTrangDanhSach || !phanTrangDanhSachInfo || !phanTrangDanhSachNav) return;
    renderPaginationBar({
      containerEl: phanTrangDanhSach,
      infoEl: phanTrangDanhSachInfo,
      navEl: phanTrangDanhSachNav,
      currentPage: classListPage,
      pageSize: CLASS_LIST_PAGE_SIZE,
      totalItems: totalItems,
      entityLabel: 'lớp',
      onPageChange: function (p) {
        classListPage = p;
        renderClasses(allClasses);
      }
    });
  }

  function renderClasses(data) {
    tbodyDanhSach.innerHTML = '';
    if (!data || data.length === 0) {
      tbodyDanhSach.innerHTML = '<tr><td colspan="5">Không tìm thấy lớp học</td></tr>';
      renderClassListPagination(0);
      return;
    }
    var totalPages = Math.max(1, Math.ceil(data.length / CLASS_LIST_PAGE_SIZE));
    if (classListPage > totalPages) classListPage = totalPages;
    var start = (classListPage - 1) * CLASS_LIST_PAGE_SIZE;
    var slice = data.slice(start, start + CLASS_LIST_PAGE_SIZE);
    slice.forEach(function (cls, idx) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + (start + idx + 1) + '</td>' +
        '<td style="text-align: left;">' + cls.lop + '</td>' +
        '<td style="text-align: left;">' + (cls.trinhDo || '') + '</td>' +
        '<td style="text-align: left;">' + cls.siSo + '</td>' +
        '<td><button class="btn-xem btn-tao-hoa-don" data-id="' + cls.id + '">Tạo hóa đơn</button></td>';
      tbodyDanhSach.appendChild(tr);
    });
    tbodyDanhSach.querySelectorAll('.btn-tao-hoa-don').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.getAttribute('data-id'), 10);
        openCauHinhView(id, 'push');
      });
    });
    renderClassListPagination(data.length);
  }

  function applyConfigDefaults() {
    document.getElementById('sel-ky-thanh-toan').value = currentMonth;
    document.getElementById('hien-thi-ky-thanh-toan').innerText = billingPeriodToLabel(currentMonth);
    document.getElementById('ipt-tong-buoi').value = String(currentTotalSessions);
  }

  function openCauHinhView(classId, historyMode) {
    currentClass = allClasses.find(function (c) { return c.id === classId; }) || null;
    if (!currentClass) return;
    errKy.textContent = '';
    errBuoi.textContent = '';
    applyConfigDefaults();
    document.getElementById('lbl-ten-lop-cau-hinh').innerText = currentClass.lop;
    switchView('view-cau-hinh');
    if (historyMode) syncUrl('config', historyMode);
  }

  function renderPreviewPagination() {
    if (!phanTrangXemTruoc || !phanTrangXemTruocInfo || !phanTrangXemTruocNav) return;
    renderPaginationBar({
      containerEl: phanTrangXemTruoc,
      infoEl: phanTrangXemTruocInfo,
      navEl: phanTrangXemTruocNav,
      currentPage: previewPage,
      pageSize: PREVIEW_PAGE_SIZE,
      totalItems: previewOrder.length,
      entityLabel: 'học sinh',
      onPageChange: function (p) {
        previewPage = p;
        renderPreviewPage();
      }
    });
  }

  function renderPreviewPage() {
    tbodyXemTruoc.innerHTML = '';
    var total = previewOrder.length;
    var totalPages = Math.max(1, Math.ceil(total / PREVIEW_PAGE_SIZE));
    if (previewPage > totalPages) previewPage = totalPages;
    var start = (previewPage - 1) * PREVIEW_PAGE_SIZE;
    var slice = previewOrder.slice(start, start + PREVIEW_PAGE_SIZE);

    slice.forEach(function (sid, idx) {
      var line = previewLineById[sid];
      if (!line) return;
      var stt = start + idx + 1;
      var maHS = line.studentId;
      var hoTen = line.ten;
      var baseFee = line.baseFee;
      var tr = document.createElement('tr');
      tr.dataset.ten = hoTen;
      tr.dataset.studentId = maHS;
      tr.dataset.baseFee = String(baseFee);
      tr.innerHTML =
        '<td style="text-align: center; vertical-align: middle;">' + String(stt).padStart(2, '0') + '</td>' +
        '<td style="text-align: center; white-space: nowrap; vertical-align: middle;">' + maHS + '</td>' +
        '<td style="text-align: center; vertical-align: middle;"><strong>' + hoTen + '</strong></td>' +
        '<td style="text-align: center; vertical-align: middle;">' + formatCurrency(baseFee) + '</td>' +
        '<td style="text-align: center; vertical-align: middle;" class="phight"><input type="text" class="input-phi-cuoi" value="' + formatCurrency(line.finalFee) + '"><div class="text-error phi-error" style="margin-top:4px;"></div></td>' +
        '<td style="text-align: left;"><input type="text" class="input-ly-do" placeholder="Ghi chú"><div class="text-error ly-do-error" style="margin-top:4px;"></div></td>';
      tbodyXemTruoc.appendChild(tr);

      var phiInput = tr.querySelector('.input-phi-cuoi');
      var lyDoInput = tr.querySelector('.input-ly-do');
      var phiError = tr.querySelector('.phi-error');
      var lyDoErrorEl = tr.querySelector('.ly-do-error');
      lyDoInput.value = line.reason || '';
      phiError.textContent = line.phiErrText || '';
      if (lyDoErrorEl) lyDoErrorEl.textContent = line.lyDoErrText || '';
      if (line.lyDoErrText) lyDoInput.classList.add('error');
      else lyDoInput.classList.remove('error');

      phiInput.addEventListener('focus', function () { this.value = parseCurrency(this.value) || ''; });
      phiInput.addEventListener('input', function () {
        line.phiErrText = '';
        if (!isFeeWithinLimit(phiInput.value)) phiError.textContent = 'Không hợp lệ';
        else phiError.textContent = '';
      });
      phiInput.addEventListener('blur', function () {
        var val = parseCurrency(this.value);
        if (!isFeeWithinLimit(val)) {
          phiError.textContent = 'Không hợp lệ';
          line.phiErrText = 'Không hợp lệ';
          val = 0;
        } else {
          phiError.textContent = '';
          line.phiErrText = '';
        }
        line.finalFee = val;
        this.value = formatCurrency(val);
        recalculateTotal();
        if (val === baseFee) lyDoInput.classList.remove('error');
      });
      lyDoInput.addEventListener('input', function () {
        line.reason = lyDoInput.value;
        lyDoInput.classList.remove('error');
        line.lyDoErrText = '';
        var lyDoError = tr.querySelector('.ly-do-error');
        if (lyDoError) lyDoError.textContent = '';
      });
    });

    renderPreviewPagination();
    recalculateTotal();
  }

  function openXemTruocView(payload, historyMode) {
    currentStudentsPayload = payload;
    errTongQuat.textContent = '';
    document.getElementById('lbl-ten-lop-xem-truoc').innerText = payload.className || '';
    document.getElementById('lbl-ky-thanh-toan').value = billingPeriodToLabel(currentMonth) || '';
    document.getElementById('lbl-tong-buoi').value = String(currentTotalSessions || 0);
    document.getElementById('lbl-don-gia').value = formatCurrency(currentUnitPrice) + ' VND/buổi';

    var baseFee = (currentTotalSessions || 0) * (currentUnitPrice || 0);
    previewLineById = {};
    previewOrder = [];
    (payload.students || []).forEach(function (s) {
      var maHS = s.studentId;
      var sid = String(maHS);
      var hoTen = (s.fullName || ((s.lastName || '') + ' ' + (s.firstName || ''))).trim();
      previewOrder.push(sid);
      previewLineById[sid] = {
        studentId: maHS,
        ten: hoTen,
        baseFee: baseFee,
        finalFee: baseFee,
        reason: '',
        phiErrText: '',
        lyDoErrText: ''
      };
    });

    previewPage = 1;
    document.getElementById('lbl-tong-hoc-sinh').innerText = String(previewOrder.length);
    renderPreviewPage();
    switchView('view-xem-truoc');
    if (historyMode) syncUrl('preview', historyMode);
  }

  function recalculateTotal() {
    var sum = 0;
    previewOrder.forEach(function (sid) {
      var line = previewLineById[sid];
      if (line) sum += line.finalFee;
    });
    document.getElementById('lbl-tong-tien').innerText = formatCurrency(sum);
  }

  selKyThanhToan.addEventListener('change', function () {
    currentMonth = this.value;
    lblKyThanhToan.innerText = this.options[this.selectedIndex].text;
    errKy.textContent = '';
  });

  var iptTongBuoi = document.getElementById('ipt-tong-buoi');
  function clampTotalSessionsInput() {
    var raw = String(iptTongBuoi.value || '').trim();
    if (!raw) return;
    var n = parseInt(raw, 10);
    if (isNaN(n)) return;
    if (n > 19) iptTongBuoi.value = '19';
    else if (n < 1) iptTongBuoi.value = '1';
  }
  iptTongBuoi.addEventListener('input', function () {
    errBuoi.textContent = '';
    clampTotalSessionsInput();
  });

  function isValidAdjustmentReason(val) {
    var s = val == null ? '' : String(val);
    if (!s.trim()) return false;
    // Must contain at least one letter or number (allow free text otherwise).
    return /[\p{L}\p{N}]/u.test(s);
  }

  document.getElementById('btn-huy-cau-hinh').addEventListener('click', function () {
    switchView('view-danh-sach');
    syncUrl('list', 'push');
  });

  document.getElementById('btn-tinh-toan').addEventListener('click', async function () {
    var totalSessions = parseInt(iptTongBuoi.value || '0', 10);
    if (isNaN(totalSessions) || totalSessions < 1 || totalSessions > 19) {
      errBuoi.textContent = 'Không hợp lệ';
      return;
    }
    currentTotalSessions = totalSessions;
    currentMonth = selKyThanhToan.value;
    try {
      var payload = await fetchClassStudentsForInvoice(currentClass.id);
      if (!payload || !Array.isArray(payload.students) || payload.students.length === 0) {
        showPopup('Lớp hiện tại chưa có học sinh!');
        return;
      }
      currentUnitPrice = Number(payload.pricePerSession || currentClass.tuitionPerSession || 0);
      openXemTruocView(payload, 'push');
    } catch (e) {
      errKy.textContent = (e && e.message) ? e.message : 'Không tải được dữ liệu lớp.';
    }
  });

  function resetPreviewGrid() {
    previewOrder.forEach(function (sid) {
      var line = previewLineById[sid];
      if (!line) return;
      line.finalFee = line.baseFee;
      line.reason = '';
      line.phiErrText = '';
      line.lyDoErrText = '';
    });
    errTongQuat.textContent = '';
    renderPreviewPage();
  }

  document.getElementById('btn-huy-xem-truoc').addEventListener('click', function () {
    resetPreviewGrid();
  });

  document.getElementById('btn-luu-hoa-don').addEventListener('click', async function () {
    if (!previewOrder.length) return;
    var ok = true;
    errTongQuat.textContent = '';
    previewOrder.forEach(function (sid) {
      var line = previewLineById[sid];
      if (!line) return;
      line.phiErrText = '';
      line.lyDoErrText = '';
      var finalFee = line.finalFee;
      if (!isFeeWithinLimit(finalFee)) {
        line.phiErrText = 'Không hợp lệ';
        ok = false;
      }
      if (finalFee !== line.baseFee && !String(line.reason || '').trim()) {
        line.lyDoErrText = 'Vui lòng nhập lý do điều chỉnh cho học sinh ' + line.ten + '!';
        ok = false;
      } else if (finalFee !== line.baseFee && !isValidAdjustmentReason(line.reason)) {
        line.lyDoErrText = 'Lý do không hợp lệ!';
        ok = false;
      }
    });
    if (!ok) {
      renderPreviewPage();
      errTongQuat.textContent = 'Vui lòng kiểm tra và sửa các lỗi trên bảng.';
      return;
    }
    var lines = previewOrder.map(function (sid) {
      var line = previewLineById[sid];
      return {
        studentId: line.studentId,
        studentName: line.ten,
        finalFee: line.finalFee,
        adjustmentReason: String(line.reason || '').trim() || null
      };
    });
    try {
      var created = await createInvoice({ classId: currentClass.id, billingPeriod: currentMonth, totalSessions: currentTotalSessions, lines: lines });
      var count = created && created.createdInvoices != null ? Number(created.createdInvoices) : lines.length;
      if (!isFinite(count) || count < 0) count = lines.length;
      showPopup('Đã tạo ' + count + ' hóa đơn thành công!');
    } catch (e) {
      showPopup((e && e.message) ? e.message : 'Không thể tạo hóa đơn');
    }
  });

  document.getElementById('popup-btn-dong').addEventListener('click', function () {
    hidePopup();
    switchView('view-danh-sach');
    syncUrl('list', 'push');
  });

  var btnTimKiem = document.getElementById('btn-tim-kiem');
  var iptTimKiem = document.getElementById('ipt-tim-kiem');
  btnTimKiem.addEventListener('click', function () { loadClasses(iptTimKiem.value.trim()); });
  iptTimKiem.addEventListener('keydown', function (e) { if (e.key === 'Enter') btnTimKiem.click(); });
  document.getElementById('btn-dat-lai').addEventListener('click', function () { iptTimKiem.value = ''; loadClasses(''); });

  var btnDangXuat = document.getElementById('btn-dang-xuat');
  var overlayDX = document.getElementById('overlay-dang-xuat');
  var popupDX = document.getElementById('popup-dang-xuat');
  btnDangXuat.addEventListener('click', function (e) { e.preventDefault(); overlayDX.style.display = 'block'; popupDX.style.display = 'block'; document.body.classList.add('popup-open'); });
  document.getElementById('popup-dx-huy').addEventListener('click', function () { overlayDX.style.display = 'none'; popupDX.style.display = 'none'; document.body.classList.remove('popup-open'); });
  document.getElementById('popup-dx-xac-nhan').addEventListener('click', function () { localStorage.removeItem('JIMS_TOKEN'); window.location.href = '../AUT-02/aut02.html'; });

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

  window.addEventListener('popstate', async function () {
    var st = parseStateFromUrl();
    if (st.view === 'list') { switchView('view-danh-sach'); return; }
    if (!st.classId) { switchView('view-danh-sach'); return; }
    currentClass = allClasses.find(function (c) { return c.id === st.classId; }) || null;
    if (!currentClass) return;
    if (st.billingPeriod) currentMonth = st.billingPeriod;
    if (st.totalSessions) currentTotalSessions = st.totalSessions;
    if (st.view === 'config') {
      openCauHinhView(st.classId, null);
      return;
    }
    if (st.view === 'preview') {
      try {
        var payload = await fetchClassStudentsForInvoice(st.classId);
        currentUnitPrice = Number(payload.pricePerSession || currentClass.tuitionPerSession || 0);
        openXemTruocView(payload, null);
      } catch (e) {
        switchView('view-danh-sach');
      }
    }
  });

  renderBillingCycles();

  loadClasses('').then(function () {
    var st = parseStateFromUrl();
    if (!st.view || st.view === 'list') {
      switchView('view-danh-sach');
      syncUrl('list', 'replace');
      return;
    }
    if (st.classId) {
      currentClass = allClasses.find(function (c) { return c.id === st.classId; }) || null;
      if (currentClass && st.view === 'config') openCauHinhView(st.classId, null);
    }
  });
});

