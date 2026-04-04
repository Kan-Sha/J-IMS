import { MAX_FEE_DIGITS } from '../utils/validation.js';

const API_BASE = (window.JIMS && window.JIMS.API_BASE) ? window.JIMS.API_BASE : 'http://127.0.0.1:8080';
const LOGIN_URL = '../AUT-02/aut02.html';

function authHeaders(extra) {
  if (window.JIMS && typeof window.JIMS.authHeaders === 'function') {
    const base = window.JIMS.authHeaders();
    return extra ? Object.assign(base, extra) : base;
  }
  const token = localStorage.getItem('JIMS_TOKEN');
  const h = extra ? Object.assign({}, extra) : {};
  if (token) h.Authorization = 'Bearer ' + token;
  return h;
}

function handleApiError(res, defaultMsg, options) {
  var suppressAlert = options && options.suppressAlert;
  return res.json().catch(function () { return null; }).then(function (payload) {
    var msg = (payload && payload.message) ? payload.message : (defaultMsg || 'Có lỗi xảy ra');
    if (res.status === 401) {
      if (!suppressAlert) alert(msg || 'Chưa đăng nhập');
      window.location.href = LOGIN_URL;
      return Promise.reject(new Error('unauthorized'));
    }
    if (!suppressAlert) {
      if (!navigator.onLine) {
        alert('Mất kết nối internet');
      } else if (res.status >= 500) {
        alert('Không thể kết nối server');
      } else {
        alert(msg);
      }
    }
    var err = Object.assign({ message: msg }, payload || {});
    return Promise.reject(err);
  });
}

export async function fetchClasses(keyword) {
  const url = API_BASE + '/api/classes/manage?search=' + encodeURIComponent(keyword || '');
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
  if (!res.ok) return handleApiError(res, 'Không tải được danh sách lớp');
  const payload = await res.json();
  if (!payload || !payload.success) {
    throw new Error((payload && payload.message) || 'Không tải được danh sách lớp');
  }
  return payload.data;
}

export async function fetchClassStudentsForInvoice(classId) {
  const url = API_BASE + '/api/classes/ope03?classId=' + encodeURIComponent(String(classId));
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
  if (!res.ok) return handleApiError(res, 'Không tải được dữ liệu lớp');
  const payload = await res.json();
  if (!payload || !payload.success) {
    throw new Error((payload && payload.message) || 'Không tải được dữ liệu lớp');
  }
  return payload.data;
}

export async function createInvoice(options) {
  const body = {
    classId: options.classId,
    billingPeriod: options.billingPeriod,
    totalSessions: options.totalSessions,
    lines: Array.isArray(options.lines) ? options.lines : []
  };

  const res = await fetch(API_BASE + '/api/invoices', {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body)
  });

  if (!res.ok) return handleApiError(res, 'Không thể tạo hóa đơn', { suppressAlert: true });
  const payload = await res.json();
  if (!payload || !payload.success) {
    throw Object.assign(new Error((payload && payload.message) || 'Không thể tạo hóa đơn'), payload || {});
  }
  return payload.data;
}

/** GET /api/classes/student-count?classId= — synced currentSize / capacity (optional FIN-01 refresh). */
export async function fetchClassStudentCount(classId) {
  const url = API_BASE + '/api/classes/student-count?classId=' + encodeURIComponent(String(classId));
  const res = await fetch(url, { credentials: 'include', headers: authHeaders() });
  if (!res.ok) return handleApiError(res, 'Không tải được sĩ số lớp', { suppressAlert: true });
  const payload = await res.json();
  if (!payload || !payload.success) {
    throw new Error((payload && payload.message) || 'Không tải được sĩ số lớp');
  }
  return payload.data;
}

