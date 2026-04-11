import { fetchInvoices, fetchClasses } from '../api/invoiceService.js';
import { generateBillingCycles, billingPeriodToLabel } from '../utils/billing.js';
import { matchesInvoiceListSearch } from '../utils/search.js';
import { renderPaginationBar } from '../utils/pagination.js';

document.addEventListener('DOMContentLoaded', function () {
  const iptTimKiem = document.getElementById('ipt-tim-kiem');
  const selFilterLop = document.getElementById('sel-filter-lop');
  const hienThiFilterLop = document.getElementById('hien-thi-filter-lop');
  const selFilterKy = document.getElementById('sel-filter-ky');
  const hienThiFilterKy = document.getElementById('hien-thi-filter-ky');
  const selFilterTt = document.getElementById('sel-filter-tt');
  const hienThiFilterTt = document.getElementById('hien-thi-filter-tt');
  const btnTimKiem = document.getElementById('btn-tim-kiem');
  const btnDatLai = document.getElementById('btn-dat-lai');
  const tbodyHoaDon = document.getElementById('tbody-hoa-don');
  const emptyState = document.getElementById('empty-state');
  const phanTrangContainer = document.getElementById('phan-trang');
  const phanTrangInfo = document.getElementById('phan-trang-info');
  const phanTrangNav = document.getElementById('phan-trang-nav');

  let currentPage = 1;
  const pageSize = 8;
  let totalItems = 0;
  let rows = [];

  function syncSelect(sel, displayEl) {
    sel.addEventListener('change', function () {
      displayEl.textContent = sel.options[sel.selectedIndex].text;
    });
  }

  function statusText(status) {
    return String(status || '').toLowerCase() === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN';
  }

  function formatNumber(num) {
    return String(num).padStart(2, '0');
  }

  function renderTable() {
    tbodyHoaDon.innerHTML = '';
    if (!rows.length) {
      emptyState.style.display = 'block';
      phanTrangContainer.style.display = 'none';
      return;
    }
    emptyState.style.display = 'none';
    rows.forEach(function (item, index) {
      const sttStr = formatNumber((currentPage - 1) * pageSize + index + 1);
      const status = statusText(item.status);
      const statusClass = status === 'ĐÃ THANH TOÁN' ? 'trang-thai-da-thanh-toan' : 'trang-thai-cho-thanh-toan';
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + sttStr + '</td>' +
        '<td style="font-weight:700;white-space:nowrap;">' + item.invoiceId + '</td>' +
        '<td style="text-align:center;font-weight:600;max-width:150px;">' + (item.studentName || '') + '</td>' +
        '<td style="white-space:nowrap;">' + (item.className || '') + '</td>' +
        '<td style="white-space:nowrap;color:var(--mau-xanh-dam);font-weight:700;">' + item.totalAmountDisplay + '</td>' +
        '<td style="white-space:nowrap;">' + billingPeriodToLabel(item.billingPeriod) + '</td>' +
        '<td><span class="trang-thai-chip ' + statusClass + '">' + status + '</span></td>' +
        '<td style="text-align:center;"><a class="h-dong-icon" href="../FIN-03/fin03.html?invoiceId=' + encodeURIComponent(item.invoiceId) + '" title="Xem chi tiết"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></a></td>';
      tbodyHoaDon.appendChild(tr);
    });
    renderPagination();
  }

  function renderPagination() {
    renderPaginationBar({
      containerEl: phanTrangContainer,
      infoEl: phanTrangInfo,
      navEl: phanTrangNav,
      currentPage: currentPage,
      pageSize: pageSize,
      totalItems: totalItems,
      entityLabel: 'hóa đơn',
      onPageChange: function (page) {
        currentPage = page;
        loadInvoices();
      }
    });
  }

  async function loadClassFilter() {
    const classes = await fetchClasses('');
    selFilterLop.innerHTML = '<option value="" selected>Chọn lớp</option>';
    classes.forEach(function (row) {
      const opt = document.createElement('option');
      opt.value = String(row.classId);
      opt.textContent = row.className;
      selFilterLop.appendChild(opt);
    });
  }

  function loadBillingPeriods() {
    const currentYear = new Date().getFullYear();
    selFilterKy.innerHTML = '<option value="" selected>Chọn kỳ</option>';
    generateBillingCycles(currentYear, 2).forEach(function (c) {
      const opt = document.createElement('option');
      opt.value = c.value;
      opt.textContent = c.label;
      selFilterKy.appendChild(opt);
    });
  }

  async function loadInvoices() {
    var selectedStatus = selFilterTt.value || null;
    if (selectedStatus === 'ĐÃ THANH TOÁN') selectedStatus = 'paid';
    if (selectedStatus === 'CHỜ THANH TOÁN') selectedStatus = 'pending';
    const keyword = iptTimKiem.value.trim();
    const serverPage = keyword ? 1 : currentPage;
    const serverPageSize = keyword ? 5000 : pageSize;
    const data = await fetchInvoices({
      q: null,
      classId: selFilterLop.value || null,
      billingPeriod: selFilterKy.value || null,
      status: selectedStatus,
      page: serverPage,
      pageSize: serverPageSize
    });
    const allItems = (data.items || []).filter(function (item) {
      return matchesInvoiceListSearch(keyword, item);
    });
    if (keyword) {
      totalItems = allItems.length;
      const start = (currentPage - 1) * pageSize;
      rows = allItems.slice(start, start + pageSize);
    } else {
      rows = allItems;
      totalItems = Number(data.totalItems || 0);
    }
    renderTable();
  }

  syncSelect(selFilterLop, hienThiFilterLop);
  syncSelect(selFilterKy, hienThiFilterKy);
  syncSelect(selFilterTt, hienThiFilterTt);
  loadBillingPeriods();

  btnTimKiem.addEventListener('click', function () { currentPage = 1; loadInvoices(); });
  iptTimKiem.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      currentPage = 1;
      loadInvoices();
    }
  });
  btnDatLai.addEventListener('click', function () {
    iptTimKiem.value = '';
    selFilterLop.value = '';
    selFilterKy.value = '';
    selFilterTt.value = '';
    hienThiFilterLop.textContent = 'Chọn lớp';
    hienThiFilterKy.textContent = 'Chọn kỳ';
    hienThiFilterTt.textContent = 'Chọn trạng thái';
    currentPage = 1;
    loadInvoices();
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

  loadClassFilter().then(loadInvoices).catch(function () {
    tbodyHoaDon.innerHTML = '<tr><td colspan="8">Không thể tải dữ liệu</td></tr>';
  });
});
