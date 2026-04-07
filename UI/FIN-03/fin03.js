import { fetchInvoiceDetail, markInvoicePaid } from '../api/invoiceService.js';
import { billingPeriodToLabel } from '../utils/billing.js';

document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search || '');
  var invoiceId = params.get('invoiceId');
  var currentInvoice = null;

  const btnDanhDauThanhToan = document.getElementById('btn-danh-dau-thanh-toan');
  const trangThaiHoaDon = document.getElementById('trang-thai-hoa-don');
  const hienThiPhuongThuc = document.getElementById('hien-thi-phuong-thuc');
  const hienThiNgayThanhToan = document.getElementById('hien-thi-ngay-thanh-toan');
  const modalOverlay = document.getElementById('modal-overlay-thanh-toan');
  const modalThanhToan = document.getElementById('modal-thanh-toan');
  const btnDongModal = document.getElementById('btn-dong-modal');
  const btnHuyThanhToan = document.getElementById('btn-huy-thanh-toan');
  const btnXacNhanThanhToan = document.getElementById('btn-xac-nhan-thanh-toan');
  const khungPhuongThuc = document.getElementById('khung-phuong-thuc');
  const hienThiPt = document.getElementById('hien-thi-pt');
  const selPhuongThuc = document.getElementById('sel-phuong-thuc');
  const loiPhuongThuc = document.getElementById('loi-phuong-thuc');

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
      document.querySelector('.meta-desc').textContent = (data.startDate || '---') + ' - ' + (data.endDate || '---');
      document.getElementById('hd-so-tien-co-ban').textContent = (data.baseAmountDisplay || '0') + ' VND';
      document.getElementById('hd-tong-chua-giam').textContent = (data.baseAmountDisplay || '0') + ' VND';
      document.getElementById('hd-tong-so-tien').textContent = (data.totalAmountDisplay || '0') + ' VND';
      var reasonCell = document.querySelector('.item-table tbody tr:nth-child(2) .item-reason');
      if (reasonCell) {
        reasonCell.innerHTML = data.adjustmentReason ? data.adjustmentReason : '<span class="badge-none">Không</span>';
      }
      updateStatusUi(data.status);
      hienThiNgayThanhToan.textContent = data.paidAtDisplay || '---';
      hienThiPhuongThuc.innerHTML = '<span>' + (data.paymentMethod || '---') + '</span>';
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
    modalOverlay.style.display = 'block';
    modalThanhToan.style.display = 'block';
    khungPhuongThuc.classList.remove('loi-input');
    loiPhuongThuc.classList.remove('hien');
    document.getElementById('ipt-ghi-chu').value = '';
    selPhuongThuc.value = 'Tiền mặt';
    hienThiPt.textContent = 'Tiền mặt';
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
    markInvoicePaid(invoiceId, selPhuongThuc.value, document.getElementById('ipt-ghi-chu').value.trim()).then(function (data) {
      currentInvoice = Object.assign({}, currentInvoice || {}, data || {});
      updateStatusUi('paid');
      hienThiPhuongThuc.innerHTML = '<span>' + (data.paymentMethod || selPhuongThuc.value) + '</span>';
      hienThiNgayThanhToan.textContent = data.paidAtDisplay || hienThiNgayThanhToan.textContent;
      dongModal();
    }).finally(function () {
      btnXacNhanThanhToan.disabled = false;
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
