import { renderPaginationBar } from '../utils/pagination.js';

function initOpe03() {
    var API_BASE = (window.JIMS && window.JIMS.API_BASE) ? window.JIMS.API_BASE : 'http://127.0.0.1:8080';
    var LOGIN_URL = '../AUT-02/aut02.html';

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

    function hienLoi(loiId, khungId, msg) {
        msg = msg == null ? '' : String(msg).trim();
        var loi = document.getElementById(loiId);
        var khung = khungId ? document.getElementById(khungId) : null;
        if (loi) {
            loi.textContent = msg;
            if (loiId === 'error-capacity') {
                loi.style.display = msg ? 'block' : 'none';
                loi.classList.remove('success-message');
                loi.classList.add('error-message');
            } else {
                loi.classList.add('hien');
            }
        }
        if (khung) khung.classList.add('loi-input');
    }

    function hienThongBaoThanhCong(msg) {
        msg = msg == null ? '' : String(msg).trim();
        var loi = document.getElementById('error-capacity');
        if (!loi) return;
        loi.textContent = msg;
        loi.style.display = msg ? 'block' : 'none';
        loi.classList.remove('error-message');
        loi.classList.add('success-message');
    }

    function xoaLoiTatCa() {
        var el = document.getElementById('error-capacity');
        if (el) {
            el.textContent = '';
            el.style.display = 'none';
            el.classList.remove('success-message');
            el.classList.add('error-message');
        }
    }

    function formatDateDdMmYyyy(iso) {
        if (!iso) return '';
        var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return String(iso);
        return m[3] + '/' + m[2] + '/' + m[1];
    }

    function docGioiTinh(g) {
        if (!g) return '';
        var s = String(g).trim();
        if (/^male$/i.test(s) || s === 'Nam') return 'Nam';
        if (/^female$/i.test(s) || s === 'Nữ') return 'Nữ';
        return s;
    }

    function normalizeForSearch(str) {
        return String(str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd');
    }

    function tokenize(str) {
        return normalizeForSearch(str).split(/\s+/).map(function (x) { return x.trim(); }).filter(Boolean);
    }

    function matchAgainstFields(search, fields) {
        var searchTokens = tokenize(search);
        if (!searchTokens.length) return true;
        var allTokens = [];
        (fields || []).forEach(function (f) {
            allTokens = allTokens.concat(tokenize(f));
        });
        return searchTokens.every(function (token) {
            return allTokens.some(function (t) { return t === token; });
        });
    }

    function layClassIdTuUrl() {
        var p = new URLSearchParams(window.location.search);
        var raw = p.get('classId');
        if (!raw) return null;
        var n = parseInt(String(raw).trim(), 10);
        if (isNaN(n) || n <= 0) return null;
        return n;
    }

    var classIdNumeric = layClassIdTuUrl();
    var classCapacity = 0;
    var classStudents = [];
    var isEditMode = false;
    var selectedToRemove = [];
    var lastCheckedIndex = null;
    var selectedToAdd = [];
    var unassignedCache = null;

    var MAIN_STUDENT_PAGE_SIZE = 8;
    var MODAL_ADD_PAGE_SIZE = 8;
    var mainStudentPage = 1;
    var modalAddPage = 1;
    var modalFilteredRows = [];

    var headerView = document.getElementById('header-view');
    var headerEdit = document.getElementById('header-edit');
    var thCheckbox = document.getElementById('th-checkbox');
    var tbody = document.getElementById('bang-hoc-sinh-body');
    var tongHocSinh = document.getElementById('hien-thi-tong');
    var checkAll = document.getElementById('check-all');
    var btnXoaChon = document.getElementById('btn-xoa-chon');
    var modalThem = document.getElementById('modal-them');
    var inputTimKiem = document.getElementById('input-tim-kiem');
    var listItems = document.getElementById('modal-list-items');
    var navClassSidebar = document.getElementById('nav-class-name-sidebar');
    var tabThongTin = document.getElementById('tab-thong-tin-chung');
    var backOpe02 = document.getElementById('back-to-ope02');
    var phanTrangMain = document.getElementById('phan-trang-ope03-main');
    var phanTrangMainInfo = document.getElementById('phan-trang-ope03-main-info');
    var phanTrangMainNav = document.getElementById('phan-trang-ope03-main-nav');
    var phanTrangModal = document.getElementById('phan-trang-ope03-modal');
    var phanTrangModalInfo = document.getElementById('phan-trang-ope03-modal-info');
    var phanTrangModalNav = document.getElementById('phan-trang-ope03-modal-nav');
    var modalCheckAll = document.getElementById('modal-check-all');

    function capNhatLinkTheoClassId() {
        var q = classIdNumeric != null ? '?classId=' + encodeURIComponent(String(classIdNumeric)) : '';
        if (tabThongTin) {
            tabThongTin.addEventListener('click', function () {
                window.location.href = '../OPE-02/ope02.html' + q;
            });
        }
        if (backOpe02) backOpe02.setAttribute('href', '../OPE-02/ope02.html' + q);
    }

    function updateCheckboxState() {
        var rowCheckboxes = document.querySelectorAll('.row-checkbox');
        checkAll.indeterminate = false;
        if (rowCheckboxes.length > 0) {
            var allOnPageSelected = Array.prototype.every.call(rowCheckboxes, function (cb) {
                return selectedToRemove.indexOf(cb.value) !== -1;
            });
            checkAll.checked = allOnPageSelected;
        } else {
            checkAll.checked = false;
        }
        if (selectedToRemove.length > 0) {
            btnXoaChon.classList.add('active');
        } else {
            btnXoaChon.classList.remove('active');
        }
    }

    function renderModalPagination() {
        if (!phanTrangModal || !phanTrangModalInfo || !phanTrangModalNav) return;
        renderPaginationBar({
            containerEl: phanTrangModal,
            infoEl: phanTrangModalInfo,
            navEl: phanTrangModalNav,
            currentPage: modalAddPage,
            pageSize: MODAL_ADD_PAGE_SIZE,
            totalItems: modalFilteredRows.length,
            entityLabel: 'học sinh',
            onPageChange: function (p) {
                modalAddPage = p;
                renderAddList(inputTimKiem.value);
            }
        });
    }

    function updateModalCheckAllState() {
        if (!modalCheckAll) return;
        var chks = listItems.querySelectorAll('.item-checkbox');
        if (chks.length === 0) {
            modalCheckAll.checked = false;
            return;
        }
        modalCheckAll.checked = Array.prototype.every.call(chks, function (cb) {
            return selectedToAdd.some(function (s) { return String(s.studentId) === cb.value; });
        });
    }

    function renderTable() {
        tbody.innerHTML = '';
        tongHocSinh.innerText = 'Tổng: ' + classStudents.length + ' học sinh';

        classStudents.forEach(function (student, index) {
            var globalIndex = index;
            var sid = student.studentId != null ? String(student.studentId) : '';
            var isChecked = selectedToRemove.indexOf(sid) !== -1;
            var tr = document.createElement('tr');
            var checkboxCell = '';
            if (isEditMode) {
                checkboxCell = '<td class="checkbox-cell"><input type="checkbox" class="custom-checkbox row-checkbox" value="'
                    + sid.replace(/"/g, '&quot;') + '"'
                    + (isChecked ? ' checked' : '')
                    + '></td>';
            }
            tr.innerHTML = checkboxCell
                + '<td>' + (globalIndex + 1) + '</td>'
                + '<td>' + (sid || '') + '</td>'
                + '<td style="font-weight: 500;">' + (student.fullName || '') + '</td>'
                + '<td>' + formatDateDdMmYyyy(student.dob) + '</td>'
                + '<td>' + docGioiTinh(student.gender) + '</td>';
            tbody.appendChild(tr);
        });
        if (phanTrangMain) phanTrangMain.style.display = 'none';

        if (isEditMode) {
            var rowCheckboxes = document.querySelectorAll('.row-checkbox');
            rowCheckboxes.forEach(function (cb, idx) {
                cb.addEventListener('change', function (e) {
                    var val = e.target.value;
                    if (e.shiftKey && lastCheckedIndex != null) {
                        var startR = Math.min(lastCheckedIndex, idx);
                        var endR = Math.max(lastCheckedIndex, idx);
                        for (var i = startR; i <= endR; i++) {
                            var rowCb = rowCheckboxes[i];
                            rowCb.checked = e.target.checked;
                            var rowVal = rowCb.value;
                            if (e.target.checked) {
                                if (selectedToRemove.indexOf(rowVal) === -1) selectedToRemove.push(rowVal);
                            } else {
                                selectedToRemove = selectedToRemove.filter(function (id) { return id !== rowVal; });
                            }
                        }
                    } else {
                        if (e.target.checked) {
                            if (selectedToRemove.indexOf(val) === -1) selectedToRemove.push(val);
                        } else {
                            selectedToRemove = selectedToRemove.filter(function (id) { return id !== val; });
                        }
                    }
                    lastCheckedIndex = idx;
                    updateCheckboxState();
                });
            });
        }
    }

    function setEditMode(state) {
        isEditMode = state;
        selectedToRemove = [];
        checkAll.checked = false;
        checkAll.indeterminate = false;
        xoaLoiTatCa();

        if (isEditMode) {
            headerView.style.display = 'none';
            headerEdit.style.display = 'flex';
            thCheckbox.style.display = 'table-cell';
        } else {
            headerView.style.display = 'flex';
            headerEdit.style.display = 'none';
            thCheckbox.style.display = 'none';
            btnXoaChon.classList.remove('active');
        }
        renderTable();
    }

    function dongModalThem() {
        if (modalThem) modalThem.style.display = 'none';
    }

    function renderAddList(searchQuery) {
        var q = searchQuery == null ? '' : String(searchQuery).trim();
        listItems.innerHTML = '';
        var rows = unassignedCache;
        modalFilteredRows = [];
        if (!rows || !rows.length) {
            renderModalPagination();
            updateModalCheckAllState();
            return;
        }
        var needle = q;
        var currentClassIds = classStudents.map(function (s) { return String(s.studentId); });
        rows.forEach(function (student) {
            var sid = student.studentId != null ? String(student.studentId) : '';
            if (currentClassIds.indexOf(sid) !== -1) return;
            var name = student.fullName || '';
            if (!matchAgainstFields(needle, [name, sid])) {
                return;
            }
            modalFilteredRows.push(student);
        });

        var totalModalPages = Math.max(1, Math.ceil(modalFilteredRows.length / MODAL_ADD_PAGE_SIZE));
        if (modalAddPage > totalModalPages) modalAddPage = totalModalPages;
        var start = (modalAddPage - 1) * MODAL_ADD_PAGE_SIZE;
        var slice = modalFilteredRows.slice(start, start + MODAL_ADD_PAGE_SIZE);

        slice.forEach(function (student) {
            var sid = student.studentId != null ? String(student.studentId) : '';
            var name = student.fullName || '';
            var isChecked = selectedToAdd.some(function (s) { return String(s.studentId) === sid; });
            var item = document.createElement('div');
            item.className = 'modal-list-item';
            item.innerHTML = '<input type="checkbox" class="custom-checkbox item-checkbox" value="'
                + sid.replace(/"/g, '&quot;') + '"'
                + (isChecked ? ' checked' : '')
                + '><div class="item-name">' + name + '</div><div class="item-id">' + sid + '</div>';
            listItems.appendChild(item);
        });

        var chks = listItems.querySelectorAll('.item-checkbox');
        chks.forEach(function (chk) {
            chk.addEventListener('change', function (e) {
                var id = e.target.value;
                if (e.target.checked) {
                    var stu = rows.find(function (s) { return String(s.studentId) === id; });
                    if (stu && !selectedToAdd.some(function (s) { return String(s.studentId) === id; })) {
                        selectedToAdd.push(stu);
                    }
                } else {
                    selectedToAdd = selectedToAdd.filter(function (s) { return String(s.studentId) !== id; });
                }
                updateModalCheckAllState();
            });
        });
        renderModalPagination();
        updateModalCheckAllState();
    }

    function taiDanhSachChuaXepLop(urlSearch) {
        var key = urlSearch || '';
        var url = API_BASE + '/api/students/unassigned?search=' + encodeURIComponent(key);
        return fetch(url, { credentials: 'include', headers: authHeaders() }).then(function (res) {
            if (res.status === 401) {
                window.location.href = LOGIN_URL;
                return null;
            }
            return res.json().catch(function () { return null; });
        }).then(function (payload) {
            if (!payload || !payload.success || !Array.isArray(payload.data)) {
                return [];
            }
            return payload.data;
        });
    }

    function taiDuLieuLop() {
        if (classIdNumeric == null) {
            hienLoi('error-capacity', null, 'Thiếu classId. Vui lòng quay lại danh sách lớp.');
            return Promise.resolve();
        }
        var url = API_BASE + '/api/classes/ope03?classId=' + encodeURIComponent(String(classIdNumeric));
        return fetch(url, { credentials: 'include', headers: authHeaders() }).then(function (res) {
            if (res.status === 401) {
                window.location.href = LOGIN_URL;
                return null;
            }
            return res.json().catch(function () { return null; });
        }).then(function (payload) {
            if (!payload || !payload.success || !payload.data) {
                var msg = (payload && payload.message) ? String(payload.message) : 'Không tải được dữ liệu lớp.';
                hienLoi('error-capacity', null, msg);
                return;
            }
            var d = payload.data;
            classCapacity = Number(d.capacity) || 0;
            classStudents = Array.isArray(d.students) ? d.students.slice() : [];
            var cn = d.className != null ? String(d.className) : '';
            if (navClassSidebar) navClassSidebar.textContent = cn || '—';
            if (cn) localStorage.setItem('selectedClassId', cn);
            mainStudentPage = 1;
            renderTable();
            if (isEditMode) updateCheckboxState();
        });
    }

    checkAll.addEventListener('change', function (e) {
        checkAll.indeterminate = false;
        var rowCheckboxes = document.querySelectorAll('.row-checkbox');
        var pageIds = Array.prototype.map.call(rowCheckboxes, function (cb) { return cb.value; });
        if (e.target.checked) {
            pageIds.forEach(function (id) {
                if (selectedToRemove.indexOf(id) === -1) selectedToRemove.push(id);
            });
            rowCheckboxes.forEach(function (cb) { cb.checked = true; });
        } else {
            selectedToRemove = selectedToRemove.filter(function (id) { return pageIds.indexOf(id) === -1; });
            rowCheckboxes.forEach(function (cb) { cb.checked = false; });
        }
        updateCheckboxState();
    });

    var btnChinhSua = document.getElementById('btn-chinh-sua');
    if (btnChinhSua) btnChinhSua.addEventListener('click', function () { setEditMode(true); });
    document.getElementById('btn-thoat').addEventListener('click', function () { setEditMode(false); });

    var overlayXoaHs = document.getElementById('overlay-xoa-hs');
    var popupXoaHs = document.getElementById('popup-xoa-hs');
    var popupXoaHsHuy = document.getElementById('popup-xoa-hs-huy');
    var popupXoaHsXacNhan = document.getElementById('popup-xoa-hs-xac-nhan');
    var pendingDeleteAction = null;

    function showDeleteConfirm(onConfirm) {
        pendingDeleteAction = onConfirm;
        if (overlayXoaHs) overlayXoaHs.style.display = 'block';
        if (popupXoaHs) popupXoaHs.style.display = 'block';
        document.body.classList.add('popup-open');
    }

    function hideDeleteConfirm() {
        if (overlayXoaHs) overlayXoaHs.style.display = 'none';
        if (popupXoaHs) popupXoaHs.style.display = 'none';
        document.body.classList.remove('popup-open');
        pendingDeleteAction = null;
    }

    if (popupXoaHsHuy) popupXoaHsHuy.addEventListener('click', hideDeleteConfirm);
    if (overlayXoaHs) overlayXoaHs.addEventListener('click', hideDeleteConfirm);
    if (popupXoaHsXacNhan) {
        popupXoaHsXacNhan.addEventListener('click', function () {
            if (typeof pendingDeleteAction === 'function') {
                pendingDeleteAction();
            }
            hideDeleteConfirm();
        });
    }

    btnXoaChon.addEventListener('click', function () {
        if (selectedToRemove.length === 0) return;
        showDeleteConfirm(function () {
            var ids = selectedToRemove.filter(function (id, i, a) { return id && a.indexOf(id) === i; });
            fetch(API_BASE + '/api/classes/enrollment', {
                method: 'POST',
                credentials: 'include',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ classId: classIdNumeric, action: 'remove', studentIds: ids })
            }).then(function (res) {
                if (res.status === 401) {
                    window.location.href = LOGIN_URL;
                    return null;
                }
                return res.json().catch(function () { return null; });
            }).then(function (payload) {
                if (payload && payload.success) {
                    selectedToRemove = [];
                    checkAll.checked = false;
                    updateCheckboxState();
                    hienThongBaoThanhCong('Đã xóa học sinh khỏi lớp!');
                    return taiDuLieuLop();
                }
                hienLoi('error-capacity', null, (payload && payload.message) ? String(payload.message) : 'Không thể xóa học sinh.');
            }).catch(function () {
                hienLoi('error-capacity', null, 'Không thể kết nối máy chủ.');
            });
        });
    });

    document.getElementById('btn-them-moi').addEventListener('click', function () {
        xoaLoiTatCa();
        selectedToAdd = [];
        inputTimKiem.value = '';
        unassignedCache = null;
        modalAddPage = 1;
        modalThem.style.display = 'flex';
        taiDanhSachChuaXepLop('').then(function (rows) {
            unassignedCache = rows;
            renderAddList('');
        });
    });

    document.getElementById('btn-close-modal').addEventListener('click', dongModalThem);
    document.getElementById('btn-huy-them').addEventListener('click', dongModalThem);

    inputTimKiem.addEventListener('input', function (e) {
        modalAddPage = 1;
        renderAddList(e.target.value);
    });

    if (modalCheckAll) {
        modalCheckAll.addEventListener('change', function (e) {
            var chks = listItems.querySelectorAll('.item-checkbox');
            var want = e.target.checked;
            chks.forEach(function (chk) {
                chk.checked = want;
                var id = chk.value;
                var stu = unassignedCache && unassignedCache.find(function (s) { return String(s.studentId) === id; });
                if (want) {
                    if (stu && !selectedToAdd.some(function (s) { return String(s.studentId) === id; })) {
                        selectedToAdd.push(stu);
                    }
                } else {
                    selectedToAdd = selectedToAdd.filter(function (s) { return String(s.studentId) !== id; });
                }
            });
            updateModalCheckAllState();
        });
    }

    document.getElementById('btn-luu-them').addEventListener('click', function () {
        var n = selectedToAdd.length;
        var modal = modalThem;

        function ketThuc() {
            if (modal) modal.style.display = 'none';
        }

        if (n === 0) {
            ketThuc();
            return;
        }

        var cur = classStudents.length;
        if (cur + n > classCapacity) {
            hienLoi('error-capacity', null, 'Số lượng học sinh vượt quá giới hạn sĩ số của lớp!');
            ketThuc();
            return;
        }

        var ids = selectedToAdd.map(function (s) { return String(s.studentId); });
        fetch(API_BASE + '/api/classes/enrollment', {
            method: 'POST',
            credentials: 'include',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ classId: classIdNumeric, action: 'add', studentIds: ids })
        }).then(function (res) {
            if (res.status === 401) {
                window.location.href = LOGIN_URL;
                return null;
            }
            return res.json().catch(function () { return null; });
        }).then(function (payload) {
            if (payload && payload.success) {
                selectedToAdd = [];
                inputTimKiem.value = '';
                xoaLoiTatCa();
                hienThongBaoThanhCong('Thêm học sinh thành công!');
                return taiDuLieuLop();
            }
            hienLoi('error-capacity', null, (payload && payload.message) ? String(payload.message) : 'Không thể thêm học sinh.');
        }).catch(function () {
            hienLoi('error-capacity', null, 'Không thể kết nối máy chủ.');
        }).finally(ketThuc);
    });

    var btnDangXuat = document.getElementById('btn-dang-xuat');
    var overlayDX = document.getElementById('overlay-dang-xuat');
    var popupDX = document.getElementById('popup-dang-xuat');

    function hienPopupDangXuat() {
        if (overlayDX) overlayDX.style.display = 'block';
        if (popupDX) popupDX.style.display = 'block';
        document.body.classList.add('popup-open');
        document.body.style.overflow = 'hidden';
        document.body.classList.remove('mobile-sidebar-open');
    }

    function anPopupDangXuat() {
        if (overlayDX) overlayDX.style.display = 'none';
        if (popupDX) popupDX.style.display = 'none';
        document.body.classList.remove('popup-open');
        document.body.style.overflow = '';
    }

    if (btnDangXuat) {
        btnDangXuat.addEventListener('click', function (e) {
            e.preventDefault();
            hienPopupDangXuat();
        });
    }
    var popupDXHuy = document.getElementById('popup-dx-huy');
    if (popupDXHuy) popupDXHuy.addEventListener('click', anPopupDangXuat);
    if (overlayDX) overlayDX.addEventListener('click', anPopupDangXuat);
    var popupDXXacNhan = document.getElementById('popup-dx-xac-nhan');
    if (popupDXXacNhan) {
        popupDXXacNhan.addEventListener('click', function () {
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

    capNhatLinkTheoClassId();

    if (classIdNumeric == null) {
        hienLoi('error-capacity', null, 'Thiếu classId. Vui lòng quay lại danh sách lớp.');
        return;
    }

    function khoiChay() {
        setEditMode(false);
        taiDuLieuLop();
    }

    if (window.JIMS && window.JIMS.ready) {
        window.JIMS.ready.then(function () { khoiChay(); });
    } else {
        khoiChay();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOpe03);
} else {
    initOpe03();
}
