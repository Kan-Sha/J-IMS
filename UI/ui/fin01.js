import { fetchClasses, fetchClassStudentsForInvoice, createInvoice } from '../api/invoiceService.js';
import { formatCurrency, parseCurrency, isFeeWithinLimit, MAX_FEE_DIGITS } from '../utils/validation.js';

document.addEventListener('DOMContentLoaded', function () {
  let allClasses = [];
  let currentClass = null;
  let currentMonth = '';
  let currentTotalSessions = 0;
  let currentUnitPrice = 0;

  const tbodyDanhSach = document.getElementById('tbody-danh-sach-lop');
  const tbodyXemTruoc = document.getElementById('tbody-xem-truoc');
  const errKy = document.getElementById('err-cau-hinh-ky');
  const errBuoi = document.getElementById('err-cau-hinh-buoi');
  const errTongQuat = document.getElementById('err-luu-tong-quat');

  function switchView(viewId) {
    ['view-danh-sach', 'view-cau-hinh', 'view-xem-truoc'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = (id === viewId) ? 'block' : 'none';
    });
  }

  async function loadClasses(keyword) {
    try {
      const rows = await fetchClasses(keyword || '');
      allClasses = (rows || []).map(function (r) {
        return {
          id: r.classId,
          lop: r.className,
          trinhDo: r.levelName,
          siSo: String(r.currentSize || 0) + '/' + String(r.capacity || 0),
          tuitionPerSession: (r.tuitionPerSession || r.pricePerSession || 0)
        };
      });
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
    var btns = tbodyDanhSach.querySelectorAll('.btn-tao-hoa-don');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.getAttribute('data-id'), 10);
        openCauHinhView(id);
      });
    });
  }

  async function openCauHinhView(classId) {
    currentClass = allClasses.find(function (c) { return c.id === classId; }) || null;
    if (!currentClass) return;
    errKy.textContent = '';
    errBuoi.textContent = '';
    document.getElementById('sel-ky-thanh-toan').value = '2025-03';
    document.getElementById('hien-thi-ky-thanh-toan').innerText = 'Tháng 3-4';
    document.getElementById('ipt-tong-buoi').value = '16';
    document.getElementById('lbl-ten-lop-cau-hinh').innerText = currentClass.lop;
    switchView('view-cau-hinh');
  }

  var selKyThanhToan = document.getElementById('sel-ky-thanh-toan');
  var lblKyThanhToan = document.getElementById('hien-thi-ky-thanh-toan');
  if (selKyThanhToan && lblKyThanhToan) {
    selKyThanhToan.addEventListener('change', function () {
      lblKyThanhToan.innerText = this.options[this.selectedIndex].text;
      errKy.textContent = '';
    });
  }

  var iptTongBuoi = document.getElementById('ipt-tong-buoi');
  if (iptTongBuoi) {
    iptTongBuoi.addEventListener('input', function () {
      errBuoi.textContent = '';
    });
  }

  var btnHuyCauHinh = document.getElementById('btn-huy-cau-hinh');
  if (btnHuyCauHinh) {
    btnHuyCauHinh.addEventListener('click', function () {
      switchView('view-danh-sach');
    });
  }

  var btnTinhToan = document.getElementById('btn-tinh-toan');
  if (btnTinhToan) {
    btnTinhToan.addEventListener('click', async function () {
      var month = selKyThanhToan ? selKyThanhToan.value : '';
      var totalSessions = parseInt(iptTongBuoi ? iptTongBuoi.value : '0', 10);
      var valid = true;

      if (isNaN(totalSessions) || totalSessions < 1 || totalSessions > 30) {
        errBuoi.textContent = 'Tổng số buổi không hợp lệ!';
        valid = false;
      }

      if (!valid) return;

      try {
        var payload = await fetchClassStudentsForInvoice(currentClass.id);
        if (!payload || !Array.isArray(payload.students) || payload.students.length === 0) {
          errKy.textContent = 'Lớp học chưa có học sinh.';
          return;
        }
        currentMonth = month;
        currentTotalSessions = totalSessions;
        currentUnitPrice = Number(payload.pricePerSession || currentClass.tuitionPerSession || 0);
        openXemTruocView(payload);
      } catch (e) {
        errKy.textContent = e && e.message ? e.message : 'Không tải được dữ liệu lớp.';
      }
    });
  }

  function openXemTruocView(payload) {
    errTongQuat.textContent = '';
    document.getElementById('lbl-ten-lop-xem-truoc').innerText = payload.className || '';
    document.getElementById('lbl-ky-thanh-toan').value = currentMonth || '';
    document.getElementById('lbl-tong-buoi').value = String(currentTotalSessions || 0);
    document.getElementById('lbl-don-gia').value = formatCurrency(currentUnitPrice) + ' VND/buổi';

    tbodyXemTruoc.innerHTML = '';
    var baseFee = (currentTotalSessions || 0) * (currentUnitPrice || 0);

    (payload.students || []).forEach(function (s, idx) {
      var maHS = s.studentId;
      var hoTen = (s.fullName || ((s.firstName || '') + ' ' + (s.lastName || ''))).trim();

      var tr = document.createElement('tr');
      tr.dataset.ten = hoTen;
      tr.dataset.studentId = maHS;
      tr.dataset.baseFee = String(baseFee);

      tr.innerHTML =
        '<td style="text-align: center; vertical-align: middle;">' + String(idx + 1).padStart(2, '0') + '</td>' +
        '<td style="text-align: center; white-space: nowrap; vertical-align: middle;">' + maHS + '</td>' +
        '<td style="text-align: center; vertical-align: middle;"><strong>' + hoTen + '</strong></td>' +
        '<td style="text-align: center; vertical-align: middle;">' + formatCurrency(baseFee) + '</td>' +
        '<td style="text-align: center; vertical-align: middle;" class="phight">' +
        '  <input type="text" class="input-phi-cuoi" value="' + formatCurrency(baseFee) + '">' +
        '  <div class="text-error phi-error" style="margin-top:4px;"></div>' +
        '</td>' +
        '<td style="text-align: left;">' +
        '  <input type="text" class="input-ly-do" placeholder="Ghi chú">' +
        '</td>';

      tbodyXemTruoc.appendChild(tr);

      var phiInput = tr.querySelector('.input-phi-cuoi');
      var lyDoInput = tr.querySelector('.input-ly-do');
      var phiError = tr.querySelector('.phi-error');

      phiInput.addEventListener('focus', function () {
        this.value = parseCurrency(this.value) || '';
      });

      function validateFeeInput() {
        var raw = phiInput.value;
        if (raw === '') {
          phiError.textContent = '';
          return true;
        }
        if (!isFeeWithinLimit(raw)) {
          phiError.textContent = 'Số tiền không được vượt quá ' + MAX_FEE_DIGITS + ' chữ số!';
          return false;
        }
        phiError.textContent = '';
        return true;
      }

      phiInput.addEventListener('input', function () {
        validateFeeInput();
      });

      phiInput.addEventListener('blur', function () {
        if (!validateFeeInput()) {
          var digits = String(parseCurrency(this.value)).slice(0, MAX_FEE_DIGITS);
          var n = digits === '' ? 0 : parseInt(digits, 10);
          this.value = formatCurrency(n);
        } else {
          var val = parseCurrency(this.value);
          this.value = formatCurrency(val);
        }
        recalculateTotal();
        var val2 = parseCurrency(this.value);
        if (val2 === baseFee) {
          lyDoInput.classList.remove('error');
          errTongQuat.textContent = '';
        }
      });

      lyDoInput.addEventListener('input', function () {
        lyDoInput.classList.remove('error');
        errTongQuat.textContent = '';
      });
    });

    document.getElementById('lbl-tong-hoc-sinh').innerText = (payload.students || []).length;
    recalculateTotal();
    switchView('view-xem-truoc');
  }

  function recalculateTotal() {
    var sum = 0;
    tbodyXemTruoc.querySelectorAll('.input-phi-cuoi').forEach(function (inp) {
      sum += parseCurrency(inp.value);
    });
    document.getElementById('lbl-tong-tien').innerText = formatCurrency(sum);
  }

  var btnHuyXemTruoc = document.getElementById('btn-huy-xem-truoc');
  if (btnHuyXemTruoc) {
    btnHuyXemTruoc.addEventListener('click', function () {
      switchView('view-cau-hinh');
    });
  }

  var btnLuuHoaDon = document.getElementById('btn-luu-hoa-don');
  if (btnLuuHoaDon) {
    btnLuuHoaDon.addEventListener('click', async function () {
      var rows = Array.prototype.slice.call(tbodyXemTruoc.querySelectorAll('tr'));
      if (!rows.length) {
        errTongQuat.textContent = 'Không thể tạo hóa đơn cho lớp rỗng!';
        return;
      }

      var ok = true;
      errTongQuat.textContent = '';

      var lines = rows.map(function (row) {
        var hocSinhName = row.dataset.ten;
        var baseFee = parseInt(row.dataset.baseFee, 10) || 0;
        var studentId = row.dataset.studentId;
        var phiInput = row.querySelector('.input-phi-cuoi');
        var lyDoInput = row.querySelector('.input-ly-do');
        var finalFee = parseCurrency(phiInput.value);

        if (finalFee < 0) {
          ok = false;
          errTongQuat.textContent = 'Phí cuối cùng không được âm!';
        }

        if (!isFeeWithinLimit(finalFee)) {
          ok = false;
          errTongQuat.textContent = 'Số tiền không được vượt quá ' + MAX_FEE_DIGITS + ' chữ số!';
        }

        if (finalFee !== baseFee && !lyDoInput.value.trim()) {
          ok = false;
          lyDoInput.classList.add('error');
          errTongQuat.textContent = 'Vui lòng nhập lý do điều chỉnh cho học sinh ' + hocSinhName + '!';
        } else {
          lyDoInput.classList.remove('error');
        }

        return {
          studentId: studentId,
          studentName: hocSinhName,
          finalFee: finalFee,
          adjustmentReason: lyDoInput.value.trim() || null
        };
      });

      if (!ok) return;

      try {
        var billingPeriod = currentMonth;
        await createInvoice({
          classId: currentClass.id,
          billingPeriod: billingPeriod,
          totalSessions: currentTotalSessions,
          lines: lines
        });
        document.getElementById('overlay-thanh-cong').style.display = 'block';
        document.getElementById('popup-thanh-cong').style.display = 'block';
      } catch (e) {
        errTongQuat.textContent = (e && e.message) ? e.message : 'Không thể lưu hóa đơn.';
      }
    });
  }

  var popupBtnDong = document.getElementById('popup-btn-dong');
  if (popupBtnDong) {
    popupBtnDong.addEventListener('click', function () {
      document.getElementById('overlay-thanh-cong').style.display = 'none';
      document.getElementById('popup-thanh-cong').style.display = 'none';
      switchView('view-danh-sach');
    });
  }

  var btnTimKiem = document.getElementById('btn-tim-kiem');
  if (btnTimKiem) {
    btnTimKiem.addEventListener('click', function () {
      var keyword = document.getElementById('ipt-tim-kiem').value.trim();
      loadClasses(keyword);
    });
  }

  var btnDatLai = document.getElementById('btn-dat-lai');
  if (btnDatLai) {
    btnDatLai.addEventListener('click', function () {
      document.getElementById('ipt-tim-kiem').value = '';
      loadClasses('');
    });
  }

  var btnDangXuat = document.getElementById('btn-dang-xuat');
  var overlayDX = document.getElementById('overlay-dang-xuat');
  var popupDX = document.getElementById('popup-dang-xuat');
  if (btnDangXuat && overlayDX && popupDX) {
    btnDangXuat.addEventListener('click', function (e) {
      e.preventDefault();
      overlayDX.style.display = 'block';
      popupDX.style.display = 'block';
      document.body.classList.add('popup-open');
    });
    var popupDXHuy = document.getElementById('popup-dx-huy');
    if (popupDXHuy) {
      popupDXHuy.addEventListener('click', function () {
        overlayDX.style.display = 'none';
        popupDX.style.display = 'none';
        document.body.classList.remove('popup-open');
      });
    }
    var popupDXXacNhan = document.getElementById('popup-dx-xac-nhan');
    if (popupDXXacNhan) {
      popupDXXacNhan.addEventListener('click', function () {
        localStorage.removeItem('JIMS_TOKEN');
        window.location.href = '../AUT-02/aut02.html';
      });
    }
  }

  loadClasses('');
});

