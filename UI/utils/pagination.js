/**
 * Shared pagination bar (FIN-02 behavior): summary text + prev/next + page window.
 * @param {object} opts
 * @param {HTMLElement|null} [opts.containerEl]
 * @param {HTMLElement} opts.infoEl
 * @param {HTMLElement} opts.navEl
 * @param {number} opts.currentPage 1-based
 * @param {number} opts.pageSize
 * @param {number} opts.totalItems
 * @param {string} opts.entityLabel e.g. "hóa đơn", "học sinh"
 * @param {function(number): void} opts.onPageChange
 */
export function renderPaginationBar(opts) {
  var containerEl = opts.containerEl || null;
  var infoEl = opts.infoEl;
  var navEl = opts.navEl;
  var currentPage = opts.currentPage;
  var pageSize = opts.pageSize;
  var totalItems = opts.totalItems;
  var entityLabel = opts.entityLabel || '';
  var onPageChange = opts.onPageChange;

  if (!infoEl || !navEl) return;

  if (totalItems <= 0) {
    if (containerEl) containerEl.style.display = 'none';
    return;
  }

  if (containerEl) containerEl.style.display = 'flex';

  var totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  var safePage = Math.min(Math.max(1, currentPage), totalPages);
  var start = (safePage - 1) * pageSize + 1;
  var end = Math.min(safePage * pageSize, totalItems);
  infoEl.textContent =
    'Hiển thị ' + start + '-' + end + ' trên tổng số ' + totalItems + ' ' + entityLabel;

  navEl.innerHTML = '';

  function addBtn(label, page, disabled, active) {
    var btn = document.createElement('button');
    btn.className = 'btn-page' + (active ? ' active' : '');
    btn.textContent = label;
    btn.disabled = !!disabled;
    btn.addEventListener('click', function () {
      if (onPageChange) onPageChange(page);
    });
    navEl.appendChild(btn);
  }

  addBtn('‹', Math.max(1, safePage - 1), safePage === 1, false);
  var p;
  for (p = Math.max(1, safePage - 1); p <= Math.min(totalPages, safePage + 1); p++) {
    addBtn(String(p), p, false, p === safePage);
  }
  addBtn('›', Math.min(totalPages, safePage + 1), safePage >= totalPages, false);
}
