import { fetchClasses, fetchClassStudentsForInvoice, createInvoice, fetchClassStudentCount } from '../api/invoiceService.js';
import { formatCurrency, parseCurrency, isFeeWithinLimit } from '../utils/validation.js';
import { generateBillingCycles, billingPeriodToLabel } from '../utils/billing.js';

document.addEventListener('DOMContentLoaded', function () {
  let allClasses = [];
  let currentClass = null;
  let currentMonth = '';
  let currentTotalSessions = 16;
  let currentUnitPrice = 0;
  let currentStudentsPayload = null;

  const tbodyDanhSach = document.getElementById('tbody-danh-sach-lop');
  const tbodyXemTruoc = document.getElementById('tbody-xem-truoc');
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
      renderClasses(allClasses);
    } catch (e) {
      tbodyDanhSach.innerHTML = '<tr><td colspan="5">Không tải được danh sách lớp</td></tr>';
    }
  }

  function renderClasses(data) {
    tbodyDanhSach.innerHTML = '';
    if (!data || data.length === 0) {
      tbodyDanhSach.innerHTML = '<tr><td colspan="5">Không tìm thấy lớp học</td></tr>';
      return;
    }
    data.forEach(function (cls, idx) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + (idx + 1) + '</td>' +
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

  function openXemTruocView(payload, historyMode) {
    currentStudentsPayload = payload;
    errTongQuat.textContent = '';
    document.getElementById('lbl-ten-lop-xem-truoc').innerText = payload.className || '';
    document.getElementById('lbl-ky-thanh-toan').value = billingPeriodToLabel(currentMonth) || '';
    document.getElementById('lbl-tong-buoi').value = String(currentTotalSessions || 0);
    document.getElementById('lbl-don-gia').value = formatCurrency(currentUnitPrice) + ' VND/buổi';

    tbodyXemTruoc.innerHTML = '';
    var baseFee = (currentTotalSessions || 0) * (currentUnitPrice || 0);

    (payload.students || []).forEach(function (s, idx) {
      var maHS = s.studentId;
      var hoTen = (s.fullName || ((s.lastName || '') + ' ' + (s.firstName || ''))).trim();
      var tr = document.createElement('tr');
      tr.dataset.ten = hoTen;
      tr.dataset.studentId = maHS;
      tr.dataset.baseFee = String(baseFee);
      tr.innerHTML =
        '<td style="text-align: center; vertical-align: middle;">' + String(idx + 1).padStart(2, '0') + '</td>' +
        '<td style="text-align: center; white-space: nowrap; vertical-align: middle;">' + maHS + '</td>' +
        '<td style="text-align: center; vertical-align: middle;"><strong>' + hoTen + '</strong></td>' +
        '<td style="text-align: center; vertical-align: middle;">' + formatCurrency(baseFee) + '</td>' +
        '<td style="text-align: center; vertical-align: middle;" class="phight"><input type="text" class="input-phi-cuoi" value="' + formatCurrency(baseFee) + '"><div class="text-error phi-error" style="margin-top:4px;"></div></td>' +
        '<td style="text-align: left;"><input type="text" class="input-ly-do" placeholder="Ghi chú"><div class="text-error ly-do-error" style="margin-top:4px;"></div></td>';
      tbodyXemTruoc.appendChild(tr);

      var phiInput = tr.querySelector('.input-phi-cuoi');
      var lyDoInput = tr.querySelector('.input-ly-do');
      var phiError = tr.querySelector('.phi-error');

      phiInput.addEventListener('focus', function () { this.value = parseCurrency(this.value) || ''; });
      phiInput.addEventListener('input', function () {
        if (!isFeeWithinLimit(phiInput.value)) phiError.textContent = 'Không hợp lệ';
        else phiError.textContent = '';
      });
      phiInput.addEventListener('blur', function () {
        var val = parseCurrency(this.value);
        if (!isFeeWithinLimit(val)) {
          phiError.textContent = 'Không hợp lệ';
          val = 0;
        } else {
          phiError.textContent = '';
        }
        this.value = formatCurrency(val);
        recalculateTotal();
        if (val === baseFee) lyDoInput.classList.remove('error');
      });
      lyDoInput.addEventListener('input', function () {
        lyDoInput.classList.remove('error');
        var lyDoError = tr.querySelector('.ly-do-error');
        if (lyDoError) lyDoError.textContent = '';
      });
    });

    document.getElementById('lbl-tong-hoc-sinh').innerText = (payload.students || []).length;
    recalculateTotal();
    switchView('view-xem-truoc');
    if (historyMode) syncUrl('preview', historyMode);
  }

  function recalculateTotal() {
    var sum = 0;
    tbodyXemTruoc.querySelectorAll('.input-phi-cuoi').forEach(function (inp) { sum += parseCurrency(inp.value); });
    document.getElementById('lbl-tong-tien').innerText = formatCurrency(sum);
  }

  selKyThanhToan.addEventListener('change', function () {
    currentMonth = this.value;
    lblKyThanhToan.innerText = this.options[this.selectedIndex].text;
    errKy.textContent = '';
  });

  var iptTongBuoi = document.getElementById('ipt-tong-buoi');
  iptTongBuoi.addEventListener('input', function () { errBuoi.textContent = ''; });

  document.getElementById('btn-huy-cau-hinh').addEventListener('click', function () {
    switchView('view-danh-sach');
    syncUrl('list', 'push');
  });

  document.getElementById('btn-tinh-toan').addEventListener('click', async function () {
    var totalSessions = parseInt(iptTongBuoi.value || '0', 10);
    if (isNaN(totalSessions) || totalSessions < 1 || totalSessions > 30) {
      errBuoi.textContent = 'Không hợp lệ';
      return;
    }
    currentTotalSessions = totalSessions;
    currentMonth = selKyThanhToan.value;
    try {
      var payload = await fetchClassStudentsForInvoice(currentClass.id);
      if (!payload || !Array.isArray(payload.students) || payload.students.length === 0) {
        errKy.textContent = 'Mục này không được để trống';
        return;
      }
      currentUnitPrice = Number(payload.pricePerSession || currentClass.tuitionPerSession || 0);
      openXemTruocView(payload, 'push');
    } catch (e) {
      errKy.textContent = (e && e.message) ? e.message : 'Không tải được dữ liệu lớp.';
    }
  });

  function resetPreviewGrid() {
    Array.prototype.slice.call(tbodyXemTruoc.querySelectorAll('tr')).forEach(function (row) {
      var baseFee = parseInt(row.dataset.baseFee, 10) || 0;
      var feeInput = row.querySelector('.input-phi-cuoi');
      var reasonInput = row.querySelector('.input-ly-do');
      var feeError = row.querySelector('.phi-error');
      var reasonError = row.querySelector('.ly-do-error');
      if (feeInput) feeInput.value = formatCurrency(baseFee);
      if (reasonInput) {
        reasonInput.value = '';
        reasonInput.classList.remove('error');
      }
      if (feeError) feeError.textContent = '';
      if (reasonError) reasonError.textContent = '';
    });
    errTongQuat.textContent = '';
    recalculateTotal();
  }

  document.getElementById('btn-huy-xem-truoc').addEventListener('click', function () {
    resetPreviewGrid();
  });

  document.getElementById('btn-luu-hoa-don').addEventListener('click', async function () {
    var rows = Array.prototype.slice.call(tbodyXemTruoc.querySelectorAll('tr'));
    if (!rows.length) return;
    var ok = true;
    errTongQuat.textContent = '';
    var lines = rows.map(function (row) {
      var hocSinhName = row.dataset.ten;
      var baseFee = parseInt(row.dataset.baseFee, 10) || 0;
      var studentId = row.dataset.studentId;
      var phiInput = row.querySelector('.input-phi-cuoi');
      var lyDoInput = row.querySelector('.input-ly-do');
      var lyDoError = row.querySelector('.ly-do-error');
      var finalFee = parseCurrency(phiInput.value);
      if (!isFeeWithinLimit(finalFee)) { ok = false; }
      if (lyDoError) lyDoError.textContent = '';
      if (finalFee !== baseFee && !lyDoInput.value.trim()) {
        ok = false;
        lyDoInput.classList.add('error');
        if (lyDoError) {
          lyDoError.textContent = 'Vui lòng nhập lý do điều chỉnh cho học sinh ' + hocSinhName + '!';
        }
      }
      return { studentId: studentId, studentName: hocSinhName, finalFee: finalFee, adjustmentReason: lyDoInput.value.trim() || null };
    });
    if (!ok) return;
    try {
      await createInvoice({ classId: currentClass.id, billingPeriod: currentMonth, totalSessions: currentTotalSessions, lines: lines });
      showPopup('Hóa đơn đã được tạo thành công!');
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

