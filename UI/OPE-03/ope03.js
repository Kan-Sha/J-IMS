document.addEventListener('DOMContentLoaded', function () {
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

    function hienThongBaoDangNhapHetHan() {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    function getNetworkFailureMessage() {
        if (!navigator.onLine) {
            return 'Mất kết nối internet. Vui lòng kiểm tra mạng.';
        }
        return 'Không thể kết nối hệ thống. Vui lòng thử lại sau.';
    }

    function formatVnd(n) {
        if (n == null) return '';
        var num = Number(n);
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('vi-VN').format(num) + ' VND';
    }

    function formatDateDdMmYyyy(iso) {
        if (!iso) return '';
        var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return String(iso);
        return m[3] + '/' + m[2] + '/' + m[1];
    }

    function dayToThu(day) {
        var d = day ? String(day).trim() : '';
        if (d === 'Monday') return 'Thứ 2';
        if (d === 'Tuesday') return 'Thứ 3';
        if (d === 'Wednesday') return 'Thứ 4';
        if (d === 'Thursday') return 'Thứ 5';
        if (d === 'Friday') return 'Thứ 6';
        if (d === 'Saturday') return 'Thứ 7';
        return d;
    }

    function sortDayKey(day) {
        var d = day ? String(day).trim() : '';
        if (d === 'Monday') return 2;
        if (d === 'Tuesday') return 3;
        if (d === 'Wednesday') return 4;
        if (d === 'Thursday') return 5;
        if (d === 'Friday') return 6;
        if (d === 'Saturday') return 7;
        return 99;
    }

    function formatTimeAmPm(t) {
        var s = t == null ? '' : String(t).trim();
        if (!s) return '';
        var m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (!m) return s;
        var hh = parseInt(m[1], 10);
        var mm = parseInt(m[2], 10);
        if (isNaN(hh) || isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return s;
        var ampm = hh >= 12 ? 'PM' : 'AM';
        var h12 = hh % 12;
        if (h12 === 0) h12 = 12;
        return String(h12) + ':' + String(mm).padStart(2, '0') + ' ' + ampm;
    }

    function mergeScheduleText(schedules) {
        var arr = Array.isArray(schedules) ? schedules.slice() : [];
        arr = arr.filter(function (s) { return s && s.dayOfWeek; });
        arr.sort(function (a, b) { return sortDayKey(a.dayOfWeek) - sortDayKey(b.dayOfWeek); });
        return arr.map(function (s) { return dayToThu(s.dayOfWeek); }).join(', ');
    }

    function mergeTimeText(schedules) {
        var arr = Array.isArray(schedules) ? schedules.slice() : [];
        arr = arr.filter(function (s) { return s && s.startTime && s.endTime; });
        if (arr.length === 0) return '';
        return formatTimeAmPm(arr[0].startTime) + ' đến ' + formatTimeAmPm(arr[0].endTime);
    }

    var detailTenLop = document.getElementById('detail-ten-lop');
    var detailCapDo = document.getElementById('detail-cap-do');
    var detailGiaoVien = document.getElementById('detail-giao-vien');
    var detailHocPhi = document.getElementById('detail-hoc-phi');
    var detailNgayKhaiGiang = document.getElementById('detail-ngay-khai-giang');
    var detailSiSo = document.getElementById('detail-si-so');
    var detailLichHoc = document.getElementById('detail-lich-hoc');
    var detailKhungGio = document.getElementById('detail-khung-gio');
    var navClassName = document.getElementById('nav-class-name');
    var hienThiTong = document.getElementById('hien-thi-tong');
    var tbody = document.getElementById('bang-hoc-sinh-body');
    var thCheckbox = document.getElementById('th-checkbox');
    var headerView = document.getElementById('header-view');
    var headerEdit = document.getElementById('header-edit');
    var btnChinhSua = document.getElementById('btn-chinh-sua');
    var btnThemMoi = document.getElementById('btn-them-moi');
    var btnXoaChon = document.getElementById('btn-xoa-chon');
    var btnThoat = document.getElementById('btn-thoat');
    var errorCapacity = document.getElementById('error-capacity');
    var modalThem = document.getElementById('modal-them');
    var btnCloseModal = document.getElementById('btn-close-modal');
    var inputTimKiem = document.getElementById('input-tim-kiem');
    var modalListItems = document.getElementById('modal-list-items');
    var btnHuyThem = document.getElementById('btn-huy-them');
    var btnLuuThem = document.getElementById('btn-luu-them');
    var overlayXoa = document.getElementById('overlay-xoa-hs');
    var popupXoa = document.getElementById('popup-xoa-hs');
    var btnXoaHuy = document.getElementById('popup-xoa-hs-huy');
    var btnXoaDongY = document.getElementById('popup-xoa-hs-dong-y');
    var logoutBtn = document.getElementById('sidebar-logout');
    var overlayDX = document.getElementById('overlay-dang-xuat');
    var popupDX = document.getElementById('popup-dang-xuat');

    var classId = null;
    var capacity = 0;
    var currentSize = 0;
    var students = [];
    var isEditMode = false;
    var pendingRemoveIds = [];

    function setPopupOpen(on) {
        if (on) {
            document.body.classList.add('popup-open');
            document.body.style.overflow = 'hidden';
            document.body.classList.remove('mobile-sidebar-open');
        } else {
            document.body.classList.remove('popup-open');
            document.body.style.overflow = '';
        }
    }

    function showModal(el) {
        if (el) {
            el.classList.add('hien');
            setPopupOpen(true);
        }
    }

    function hideModal(el) {
        if (el) {
            el.classList.remove('hien');
            setPopupOpen(false);
        }
    }

    function showOverlayPair(overlayEl, popupEl) {
        if (overlayEl) overlayEl.style.display = 'block';
        if (popupEl) popupEl.style.display = 'block';
        setPopupOpen(true);
    }

    function hideOverlayPair(overlayEl, popupEl) {
        if (overlayEl) overlayEl.style.display = 'none';
        if (popupEl) popupEl.style.display = 'none';
        setPopupOpen(false);
    }

    function getQueryParam(name) {
        var qs = window.location.search || '';
        var m = qs.match(new RegExp('[?&]' + name + '=([^&]+)'));
        return m ? decodeURIComponent(m[1]) : '';
    }

    function renderTable() {
        if (!tbody) return;
        tbody.innerHTML = '';
        if (hienThiTong) {
            hienThiTong.textContent = 'Tổng: ' + String(students.length) + ' học sinh';
        }
        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:24px; color: var(--mau-chu-phu); font-style: italic;">Chưa có học sinh trong lớp.</td></tr>';
            return;
        }
        students.forEach(function (s, idx) {
            var tr = document.createElement('tr');
            var chk = '';
            if (isEditMode) {
                chk = '<td class="checkbox-cell"><input type="checkbox" class="row-check" value="' +
                    String(s.studentId || '').replace(/"/g, '') + '"></td>';
            }
            tr.innerHTML = chk +
                '<td>' + (idx + 1) + '</td>' +
                '<td>' + (s.studentId || '') + '</td>' +
                '<td style="font-weight:600;">' + (s.fullName || '') + '</td>' +
                '<td>' + (s.dob ? formatDateDdMmYyyy(s.dob) : '') + '</td>' +
                '<td>' + (s.gender || '') + '</td>';
            tbody.appendChild(tr);
        });
        if (thCheckbox) {
            thCheckbox.style.display = isEditMode ? 'table-cell' : 'none';
        }
    }

    function setEditMode(on) {
        isEditMode = !!on;
        if (headerView) headerView.style.display = isEditMode ? 'none' : 'flex';
        if (headerEdit) headerEdit.style.display = isEditMode ? 'flex' : 'none';
        renderTable();
    }

    async function taiChiTiet() {
        var url = API_BASE + '/api/classes/detail?classId=' + encodeURIComponent(String(classId));
        var res = await fetch(url, { credentials: 'include', headers: authHeaders() });
        var payload = await res.json().catch(function () { return null; });
        if (res.status === 401) throw { code: 401 };
        if (!payload || !payload.success || !payload.data) throw new Error('detail');
        return payload.data;
    }

    function renderDetail(data) {
        if (!data) return;
        capacity = data.capacity != null ? Number(data.capacity) : 0;
        currentSize = data.currentSize != null ? Number(data.currentSize) : 0;
        students = Array.isArray(data.students) ? data.students : [];

        if (navClassName) navClassName.textContent = data.className || 'Chi tiết lớp';
        if (detailTenLop) detailTenLop.value = data.className || '';
        if (detailCapDo) detailCapDo.value = data.levelName || '';
        if (detailGiaoVien) detailGiaoVien.value = data.teacherName || '';
        if (detailHocPhi) detailHocPhi.value = formatVnd(data.pricePerSession != null ? data.pricePerSession : data.tuitionPerSession);
        if (detailNgayKhaiGiang) detailNgayKhaiGiang.value = data.startDate ? formatDateDdMmYyyy(data.startDate) : '';
        if (detailSiSo) detailSiSo.value = String(currentSize) + ' / ' + String(capacity);
        if (detailLichHoc) detailLichHoc.textContent = mergeScheduleText(data.schedules);
        if (detailKhungGio) detailKhungGio.textContent = mergeTimeText(data.schedules);

        renderTable();
    }

    async function taiDanhSachChuaXep(q) {
        var url = API_BASE + '/api/students/unassigned?search=' + encodeURIComponent((q || '').trim());
        var res = await fetch(url, { credentials: 'include', headers: authHeaders() });
        var payload = await res.json().catch(function () { return null; });
        if (res.status === 401) throw { code: 401 };
        if (!payload || !payload.success || !Array.isArray(payload.data)) throw new Error('unassigned');
        return payload.data;
    }

    function renderModalList(rows) {
        if (!modalListItems) return;
        modalListItems.innerHTML = '';
        if (!rows || rows.length === 0) {
            modalListItems.innerHTML = '<div class="modal-row" style="grid-template-columns: 1fr;"><span>Không có học sinh phù hợp.</span></div>';
            return;
        }
        rows.forEach(function (s) {
            var div = document.createElement('div');
            div.className = 'modal-row';
            div.innerHTML =
                '<input type="checkbox" class="pick-student" value="' + String(s.studentId || '').replace(/"/g, '') + '">' +
                '<span>' + (s.fullName || '') + '</span>' +
                '<span>' + (s.studentId || '') + '</span>';
            modalListItems.appendChild(div);
        });
    }

    async function submitAdd() {
        if (errorCapacity) {
            errorCapacity.style.display = 'none';
            errorCapacity.textContent = '';
        }
        var picked = [];
        document.querySelectorAll('.pick-student:checked').forEach(function (cb) {
            picked.push(String(cb.value || '').trim());
        });
        picked = picked.filter(function (x) { return !!x; });
        if (picked.length === 0) {
            alert('Vui lòng chọn ít nhất 1 học sinh.');
            return;
        }
        if (currentSize + picked.length > capacity) {
            if (errorCapacity) {
                errorCapacity.textContent = 'Số lượng học sinh vượt quá giới hạn sĩ số của lớp!';
                errorCapacity.style.display = 'block';
            }
            return;
        }

        var res = await fetch(API_BASE + '/api/classes/enrollment', {
            method: 'POST',
            credentials: 'include',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ action: 'add', classId: Number(classId), studentIds: picked })
        });
        var payload = await res.json().catch(function () { return null; });
        if (res.status === 401) throw { code: 401 };
        if (res.status === 403) {
            alert((payload && payload.message) ? String(payload.message) : 'Bạn không có quyền chỉnh sửa lớp!');
            return;
        }
        if (!payload || !payload.success) {
            var msg = payload && payload.message ? String(payload.message) : 'Không thể thêm học sinh.';
            if (msg.indexOf('Số lượng học sinh') !== -1 || msg.indexOf('giới hạn') !== -1) {
                if (errorCapacity) {
                    errorCapacity.textContent = msg;
                    errorCapacity.style.display = 'block';
                }
            } else {
                alert(msg);
            }
            return;
        }

        hideModal(modalThem);
        alert('Thêm học sinh thành công!');
        var detail = await taiChiTiet();
        renderDetail(detail);
    }

    async function submitRemove(ids) {
        var res = await fetch(API_BASE + '/api/classes/enrollment', {
            method: 'POST',
            credentials: 'include',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ action: 'remove', classId: Number(classId), studentIds: ids })
        });
        var payload = await res.json().catch(function () { return null; });
        if (res.status === 401) throw { code: 401 };
        if (res.status === 403) {
            alert((payload && payload.message) ? String(payload.message) : 'Bạn không có quyền chỉnh sửa lớp!');
            return;
        }
        if (!payload || !payload.success) {
            alert((payload && payload.message) ? String(payload.message) : 'Không thể xóa học sinh khỏi lớp.');
            return;
        }
        alert('Đã xóa học sinh khỏi lớp!');
        var detail = await taiChiTiet();
        renderDetail(detail);
    }

    async function openModalThem() {
        if (inputTimKiem) inputTimKiem.value = '';
        try {
            var rows = await taiDanhSachChuaXep('');
            renderModalList(rows);
        } catch (e) {
            if (e && e.code === 401) throw e;
            renderModalList([]);
        }
        showModal(modalThem);
    }

    if (btnChinhSua) btnChinhSua.addEventListener('click', function () { setEditMode(true); });
    if (btnThoat) btnThoat.addEventListener('click', function () { setEditMode(false); });
    if (btnThemMoi) {
        btnThemMoi.addEventListener('click', function () {
            openModalThem().catch(function (e) { handleErr(e); });
        });
    }
    if (btnCloseModal) btnCloseModal.addEventListener('click', function () { hideModal(modalThem); });
    if (btnHuyThem) btnHuyThem.addEventListener('click', function () { hideModal(modalThem); });
    if (btnLuuThem) {
        btnLuuThem.addEventListener('click', function () {
            submitAdd().catch(function (e) { handleErr(e); });
        });
    }
    if (inputTimKiem) {
        var t = null;
        inputTimKiem.addEventListener('input', function () {
            clearTimeout(t);
            t = setTimeout(function () {
                taiDanhSachChuaXep(inputTimKiem.value).then(renderModalList).catch(function () { renderModalList([]); });
            }, 300);
        });
    }

    if (btnXoaChon) {
        btnXoaChon.addEventListener('click', function () {
            pendingRemoveIds = [];
            document.querySelectorAll('.row-check:checked').forEach(function (cb) {
                pendingRemoveIds.push(String(cb.value || '').trim());
            });
            pendingRemoveIds = pendingRemoveIds.filter(function (x) { return !!x; });
            if (pendingRemoveIds.length === 0) {
                alert('Vui lòng chọn học sinh cần xóa.');
                return;
            }
            showOverlayPair(overlayXoa, popupXoa);
        });
    }
    if (btnXoaHuy) btnXoaHuy.addEventListener('click', function () { hideOverlayPair(overlayXoa, popupXoa); });
    if (overlayXoa) overlayXoa.addEventListener('click', function () { hideOverlayPair(overlayXoa, popupXoa); });
    if (btnXoaDongY) {
        btnXoaDongY.addEventListener('click', function () {
            hideOverlayPair(overlayXoa, popupXoa);
            var ids = pendingRemoveIds.slice();
            pendingRemoveIds = [];
            submitRemove(ids).catch(function (e) { handleErr(e); });
        });
    }

    function hienPopupDangXuat() {
        if (overlayDX) overlayDX.style.display = 'block';
        if (popupDX) popupDX.style.display = 'block';
        setPopupOpen(true);
    }

    function anPopupDangXuat() {
        if (overlayDX) overlayDX.style.display = 'none';
        if (popupDX) popupDX.style.display = 'none';
        setPopupOpen(false);
    }

    if (logoutBtn) logoutBtn.addEventListener('click', function (e) { e.preventDefault(); hienPopupDangXuat(); });
    var btnHuyDX = document.getElementById('popup-dx-huy');
    if (btnHuyDX) btnHuyDX.addEventListener('click', anPopupDangXuat);
    if (overlayDX) overlayDX.addEventListener('click', anPopupDangXuat);
    var btnXacNhanDX = document.getElementById('popup-dx-xac-nhan');
    if (btnXacNhanDX) {
        btnXacNhanDX.addEventListener('click', function () {
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

    function handleErr(e) {
        if (e && e.code === 401) {
            localStorage.removeItem('JIMS_TOKEN');
            hienThongBaoDangNhapHetHan();
            window.location.href = LOGIN_URL;
            return;
        }
        alert(getNetworkFailureMessage());
    }

    (async function init() {
        try {
            if (window.JIMS && window.JIMS.ready) {
                await window.JIMS.ready;
            }
            classId = getQueryParam('classId');
            if (!classId) {
                window.location.href = '../OPE-02/ope02.html';
                return;
            }
            var detail = await taiChiTiet();
            renderDetail(detail);
            setEditMode(false);
        } catch (e) {
            handleErr(e);
        }
    })();
});
