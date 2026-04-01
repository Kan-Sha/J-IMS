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

    var viewDanhSach = document.getElementById('view-danh-sach');
    var viewChiTiet = document.getElementById('view-chi-tiet');
    var navDanhSach = document.getElementById('nav-danh-sach-lop');
    var navChiTietContainer = document.getElementById('nav-chi-tiet-container');
    var navClassNameSidebar = document.getElementById('nav-class-name-sidebar');

    var detailTenLop = document.getElementById('detail-ten-lop');
    var detailCapDo = document.getElementById('detail-cap-do');
    var detailGiaoVien = document.getElementById('detail-giao-vien');
    var detailHocPhi = document.getElementById('detail-hoc-phi');
    var detailNgayKhaiGiang = document.getElementById('detail-ngay-khai-giang');
    var detailSoLuong = document.getElementById('detail-so-luong');
    var detailLichHoc = document.getElementById('detail-lich-hoc');
    var detailKhungGio = document.getElementById('detail-khung-gio');

    var inputTim = document.getElementById('tim-kiem-lop');
    var nutTim = document.getElementById('nut-tim-kiem');
    var nutDatLai = document.getElementById('nut-dat-lai');
    var tbody = document.getElementById('bang-than');

    var danhSachLop = [];
    var currentClassId = null;
    var pendingClassIdFromUrl = null;

    function urlWithoutQuery() {
        return window.location.pathname;
    }

    function setUrlForView(view, classId, mode) {
        var url = urlWithoutQuery();
        if (view === 'detail' && classId != null) {
            url += '?classId=' + encodeURIComponent(String(classId));
        }
        var state = view === 'detail'
            ? { view: 'detail', classId: classId != null ? String(classId) : null }
            : { view: 'list' };

        try {
            if (mode === 'replace') window.history.replaceState(state, '', url);
            else window.history.pushState(state, '', url);
        } catch (e) {
            // ignore (some environments may block history manipulation)
        }
    }

    function showList(opts) {
        if (viewDanhSach) viewDanhSach.style.display = 'block';
        if (viewChiTiet) viewChiTiet.style.display = 'none';
        if (navChiTietContainer) navChiTietContainer.style.display = 'none';
        if (navDanhSach) navDanhSach.classList.add('active');
        currentClassId = null;

        if (opts && opts.history) {
            setUrlForView('list', null, opts.history);
        }
    }

    function showDetail(cls, opts) {
        if (!cls) return;
        currentClassId = cls.classId;

        if (navClassNameSidebar) navClassNameSidebar.innerText = cls.className || '';
        if (detailTenLop) detailTenLop.value = cls.className || '';
        if (detailCapDo) detailCapDo.value = cls.levelName || '';
        if (detailGiaoVien) detailGiaoVien.value = cls.teacherName || '';
        if (detailHocPhi) detailHocPhi.value = formatVnd(cls.pricePerSession);
        if (detailNgayKhaiGiang) detailNgayKhaiGiang.value = formatDateDdMmYyyy(cls.startDate);
        if (detailSoLuong) detailSoLuong.value = cls.capacity != null ? String(cls.capacity) : '';
        if (detailLichHoc) detailLichHoc.innerText = cls.scheduleText || '';
        if (detailKhungGio) detailKhungGio.innerText = cls.timeText || '';

        if (viewDanhSach) viewDanhSach.style.display = 'none';
        if (viewChiTiet) viewChiTiet.style.display = 'block';
        if (navChiTietContainer) navChiTietContainer.style.display = 'block';
        if (navDanhSach) navDanhSach.classList.remove('active');

        var tabs = document.querySelectorAll('.tab-item');
        var contents = document.querySelectorAll('.tab-content-item');
        tabs.forEach(function (t) { t.classList.remove('active'); });
        contents.forEach(function (c) { c.style.display = 'none'; });
        if (tabs.length > 0) tabs[0].classList.add('active');
        if (contents.length > 0) contents[0].style.display = 'block';

        if (opts && opts.history) {
            setUrlForView('detail', cls.classId, opts.history);
        }
    }

    function renderTable(data) {
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 32px; color: var(--mau-chu-phu); font-style: italic; font-weight: 500;">Không tìm thấy lớp học nào phù hợp!</td></tr>';
            return;
        }

        data.forEach(function (cls) {
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + (cls.className || '') + '</td>' +
                '<td>' + (cls.levelName || '') + '</td>' +
                '<td>' + (cls.scheduleText || '') + '</td>' +
                '<td>' + (cls.teacherName || '') + '</td>' +
                '<td><button class="btn-xem" type="button" data-id="' + String(cls.classId) + '">Xem chi tiết</button></td>';
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.btn-xem').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = this.getAttribute('data-id');
                var cls = danhSachLop.find(function (x) { return String(x.classId) === String(id); });
                if (!cls) return;

                showDetail(cls, { history: 'push' });
            });
        });
    }

    function mergeScheduleText(schedules) {
        var arr = Array.isArray(schedules) ? schedules.slice() : [];
        arr = arr.filter(function (s) { return s && s.dayOfWeek; });
        arr.sort(function (a, b) { return sortDayKey(a.dayOfWeek) - sortDayKey(b.dayOfWeek); });
        var days = arr.map(function (s) { return dayToThu(s.dayOfWeek); });
        return days.join(', ');
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

    function mergeTimeText(schedules) {
        var arr = Array.isArray(schedules) ? schedules.slice() : [];
        arr = arr.filter(function (s) { return s && s.startTime && s.endTime; });
        if (arr.length === 0) return '';
        return formatTimeAmPm(arr[0].startTime) + ' đến ' + formatTimeAmPm(arr[0].endTime);
    }

    async function taiDanhSachLop(search) {
        try {
            var url = API_BASE + '/api/classes/manage?search=' + encodeURIComponent(search || '');
            var res = await fetch(url, { credentials: 'include', headers: authHeaders() });
            var payload = await res.json().catch(function () { return null; });
            if (res.status === 401) {
                localStorage.removeItem('JIMS_TOKEN');
                hienThongBaoDangNhapHetHan();
                window.location.href = LOGIN_URL;
                return;
            }
            if (!payload || !payload.success || !Array.isArray(payload.data)) {
                alert((payload && payload.message) ? String(payload.message) : 'Không thể tải danh sách lớp.');
                renderTable([]);
                return;
            }
            danhSachLop = payload.data.map(function (c) {
                var scheduleText = mergeScheduleText(c.schedules);
                var timeText = mergeTimeText(c.schedules);
                return Object.assign({}, c, { scheduleText: scheduleText, timeText: timeText });
            });

            // sort newest first (same as backend order)
            renderTable(danhSachLop);

            if (pendingClassIdFromUrl != null) {
                var wanted = pendingClassIdFromUrl;
                pendingClassIdFromUrl = null;
                var cls = danhSachLop.find(function (x) { return String(x.classId) === String(wanted); });
                if (cls) {
                    showDetail(cls, { history: 'replace' });
                } else {
                    showList({ history: 'replace' });
                }
            }
        } catch (e) {
            alert(getNetworkFailureMessage());
            renderTable([]);
        }
    }

    if (nutTim && inputTim) {
        nutTim.addEventListener('click', function () {
            taiDanhSachLop((inputTim.value || '').trim());
        });
        inputTim.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') nutTim.click();
        });
    }

    if (nutDatLai && inputTim) {
        nutDatLai.addEventListener('click', function () {
            inputTim.value = '';
            taiDanhSachLop('');
        });
    }

    if (navDanhSach) {
        navDanhSach.addEventListener('click', function (e) {
            e.preventDefault();
            var wasDetail = viewChiTiet && viewChiTiet.style.display === 'block';
            showList({ history: wasDetail ? 'push' : null });
        });
    }

    var backBtn = document.querySelector('.sub-sidebar-tieu-de .back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (viewChiTiet && viewChiTiet.style.display === 'block' && navDanhSach) {
                navDanhSach.click();
            }
        });
    }

    window.addEventListener('popstate', function (e) {
        var state = e && e.state ? e.state : null;
        if (!state || state.view === 'list') {
            showList(null);
            return;
        }
        if (state.view === 'detail' && state.classId != null) {
            var cls = danhSachLop.find(function (x) { return String(x.classId) === String(state.classId); });
            if (cls) {
                showDetail(cls, null);
            } else {
                pendingClassIdFromUrl = String(state.classId);
                taiDanhSachLop((inputTim && inputTim.value ? String(inputTim.value) : '').trim());
            }
        }
    });

    var tabs = document.querySelectorAll('.tab-item');
    var contents = document.querySelectorAll('.tab-content-item');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            var tabId0 = this.getAttribute('data-tab');
            if (tabId0 === 'tab-danh-sach' && currentClassId != null) {
                window.location.href = '../OPE-03/ope03.html?classId=' + encodeURIComponent(String(currentClassId));
                return;
            }
            tabs.forEach(function (t) { t.classList.remove('active'); });
            contents.forEach(function (c) { c.style.display = 'none'; });
            this.classList.add('active');
            var tabId = tabId0;
            var target = document.getElementById(tabId);
            if (target) target.style.display = 'block';
        });
    });

    var logoutBtn = document.getElementById('sidebar-logout');
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

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            hienPopupDangXuat();
        });
    }

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

    (function initHistoryFromUrl() {
        var params = new URLSearchParams(window.location.search || '');
        var classId = params.get('classId');
        if (classId) {
            pendingClassIdFromUrl = classId;
            setUrlForView('detail', classId, 'replace');
        } else {
            setUrlForView('list', null, 'replace');
        }
    })();

    taiDanhSachLop('');
});
