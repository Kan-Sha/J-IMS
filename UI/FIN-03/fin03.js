import { fetchInvoiceDetail, markInvoicePaid } from '../api/invoiceService.js';
import { billingPeriodToLabel } from '../utils/billing.js';

document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search || '');
  var invoiceId = params.get('invoiceId');
  var currentInvoice = null;

  const btnDanhDauThanhToan = document.getElementById('btn-danh-dau-thanh-toan');
  const trangThaiHoaDon = document.getElementById('trang-thai-hoa-don');
  const txtPhuongThuc = document.getElementById('txt-phuong-thuc');
  const txtNgayThanhToan = document.getElementById('txt-ngay-thanh-toan');
  const modalOverlay = document.getElementById('modal-overlay-thanh-toan');
  const modalThanhToan = document.getElementById('modal-thanh-toan');
  const btnDongModal = document.getElementById('btn-dong-modal');
  const btnHuyThanhToan = document.getElementById('btn-huy-thanh-toan');
  const btnXacNhanThanhToan = document.getElementById('btn-xac-nhan-thanh-toan');
  const khungPhuongThuc = document.getElementById('khung-phuong-thuc');
  const hienThiPt = document.getElementById('hien-thi-pt');
  const selPhuongThuc = document.getElementById('sel-phuong-thuc');
  const loiPhuongThuc = document.getElementById('loi-phuong-thuc');
  const modalMaHoaDon = document.getElementById('modal-ma-hoa-don');
  const modalTenHocSinh = document.getElementById('modal-ten-hoc-sinh');
  const modalTongSoTien = document.getElementById('modal-tong-so-tien');

  function formatDate(isoOrYmd) {
    if (!isoOrYmd) return '---';
    var m = String(isoOrYmd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return m[3] + '/' + m[2] + '/' + m[1];
    var d = new Date(isoOrYmd);
    if (isNaN(d.getTime())) return String(isoOrYmd);
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  }

  function nowVietnamDateString() {
    var now = new Date();
    var vnNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    return String(vnNow.getDate()).padStart(2, '0') + '/' + String(vnNow.getMonth() + 1).padStart(2, '0') + '/' + vnNow.getFullYear();
  }

  function parseVndDisplay(raw) {
    return Number(String(raw || '0').replace(/[^\d]/g, '')) || 0;
  }

  function toVnd(n) {
    return (Number(n) || 0).toLocaleString('vi-VN') + ' VND';
  }

  function backToList() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = '../FIN-02/fin02.html';
  }
  ['btn-back-sub-sidebar', 'btn-back-header'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      backToList();
    });
  });

  function updateStatusUi(status) {
    var paid = String(status || '').toLowerCase() === 'paid';
    trangThaiHoaDon.textContent = paid ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN';
    trangThaiHoaDon.className = 'status-badge ' + (paid ? 'da-thanh-toan' : 'cho-thanh-toan');
    btnDanhDauThanhToan.style.display = paid ? 'none' : 'inline-flex';
  }

  function loadData() {
    if (!invoiceId) {
      backToList();
      return;
    }
    fetchInvoiceDetail(invoiceId).then(function (data) {
      currentInvoice = data;
      document.getElementById('hd-ma-hoa-don').textContent = data.invoiceId || '';
      document.getElementById('hd-ten-hoc-sinh').textContent = data.studentName || '---';
      document.getElementById('hd-ma-hoc-sinh').textContent = data.studentId || '---';
      document.getElementById('hd-lop').textContent = data.className || '---';
      document.getElementById('hd-ky-hoa-don').textContent = billingPeriodToLabel(data.billingPeriod);
      document.getElementById('hd-ky-khoang-ngay').textContent = formatDate(data.startDate) + ' - ' + formatDate(data.endDate);
      document.getElementById('hd-so-tien-co-ban').textContent = (data.baseAmountDisplay || '0') + ' VND';
      document.getElementById('hd-tong-chua-giam').textContent = (data.baseAmountDisplay || '0') + ' VND';
      document.getElementById('hd-tong-so-tien').textContent = (data.totalAmountDisplay || '0') + ' VND';

      var baseAmount = parseVndDisplay(data.baseAmountDisplay);
      var finalAmount = parseVndDisplay(data.totalAmountDisplay);
      var discount = Math.max(0, baseAmount - finalAmount);
      document.getElementById('hd-giam-gia').textContent = '-' + toVnd(discount);
      document.getElementById('hd-chiet-khau').textContent = '-' + toVnd(discount);

      var reasonCell = document.querySelector('.item-table tbody tr:nth-child(2) .item-reason');
      if (reasonCell) {
        reasonCell.innerHTML = data.adjustmentReason ? data.adjustmentReason : '<span class="badge-none">Không</span>';
      }
      updateStatusUi(data.status);
      if (txtNgayThanhToan) txtNgayThanhToan.textContent = formatDate(data.paidAt || data.paidAtDisplay);
      if (txtPhuongThuc) txtPhuongThuc.textContent = data.paymentMethod || 'Tiền mặt/Chuyển khoản';
    }).catch(function () {
      backToList();
    });
  }

  function dongModal() {
    modalOverlay.style.display = 'none';
    modalThanhToan.style.display = 'none';
  }

  selPhuongThuc.addEventListener('change', function (e) {
    hienThiPt.textContent = e.target.options[e.target.selectedIndex].text;
    khungPhuongThuc.classList.remove('loi-input');
    loiPhuongThuc.classList.remove('hien');
  });
  btnDanhDauThanhToan.addEventListener('click', function () {
    if (!currentInvoice) return;
    modalOverlay.style.display = 'block';
    modalThanhToan.style.display = 'block';
    khungPhuongThuc.classList.remove('loi-input');
    loiPhuongThuc.classList.remove('hien');
    document.getElementById('ipt-ghi-chu').value = '';
    selPhuongThuc.value = 'Tiền mặt';
    hienThiPt.textContent = 'Tiền mặt';
    modalMaHoaDon.textContent = currentInvoice.invoiceId || '---';
    modalTenHocSinh.textContent = currentInvoice.studentName || '---';
    modalTongSoTien.textContent = (currentInvoice.totalAmountDisplay || '0') + ' VND';
  });
  btnDongModal.addEventListener('click', dongModal);
  btnHuyThanhToan.addEventListener('click', dongModal);
  modalOverlay.addEventListener('click', dongModal);

  btnXacNhanThanhToan.addEventListener('click', function () {
    if (!selPhuongThuc.value) {
      khungPhuongThuc.classList.add('loi-input');
      loiPhuongThuc.classList.add('hien');
      loiPhuongThuc.textContent = 'Mục này không được để trống';
      return;
    }
    btnXacNhanThanhToan.disabled = true;
    btnXacNhanThanhToan.textContent = 'Đang xử lý...';
    markInvoicePaid(invoiceId, selPhuongThuc.value, document.getElementById('ipt-ghi-chu').value.trim()).then(function (data) {
      currentInvoice = Object.assign({}, currentInvoice || {}, data || {});
      updateStatusUi('paid');
      if (txtPhuongThuc) txtPhuongThuc.textContent = data.paymentMethod || selPhuongThuc.value;
      if (txtNgayThanhToan) {
        // Always reflect confirmation date in Vietnam timezone to avoid off-by-one day.
        txtNgayThanhToan.textContent = nowVietnamDateString();
      }
      dongModal();
    }).catch(function (e) {
      alert((e && e.message) ? e.message : 'Không thể xác nhận thanh toán');
    }).finally(function () {
      btnXacNhanThanhToan.disabled = false;
      btnXacNhanThanhToan.innerHTML = 'Xác nhận<br>thanh toán';
    });
  });

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

  loadData();
});
