/**
 * J-IMS shared shell: session check, role-based sidebar links, hide Admin-only UI for Teacher/TA.
  * Requires: <body data-jims-page="aut01|stu01|stu03|aut03|ope01|ope02|ope03|fin01|fin02|fin03" class="jims-shell-loading">
 * Load before page-specific *.js
 */
(function () {
  var API_BASE = 'http://127.0.0.1:8080';
  var isSessionExpiredHandled = false;

  function handleSessionExpired(message) {
    if (isSessionExpiredHandled) return;
    isSessionExpiredHandled = true;
    alert(message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    window.location.href = '../AUT-02/aut02.html';
  }

  function getNetworkFailureMessage() {
    if (!navigator.onLine) return 'Mất kết nối internet. Vui lòng kiểm tra mạng.';
    return 'Không thể kết nối hệ thống. Vui lòng thử lại sau.';
  }

  function authHeaders() {
    var token = localStorage.getItem('JIMS_TOKEN');
    var h = {};
    if (token) {
      h.Authorization = 'Bearer ' + token;
    }
    return h;
  }

  function pathMap(page) {
    var m = {
      aut01: {
        stu01: '../STU-01/stu01.html',
        stu03: '../STU-03/stu03.html',
        aut01: 'aut01.html',
        aut03: '../AUT-03/aut03.html',
        ope01: '../OPE-01/ope01.html',
        ope02: '../OPE-02/ope02.html',
        ope03: '../OPE-03/ope03.html',
        fin01: '../FIN-01/fin01.html'
      },
      stu01: {
        stu01: 'stu01.html',
        stu03: '../STU-03/stu03.html',
        aut01: '../AUT-01/aut01.html',
        aut03: '../AUT-03/aut03.html',
        ope01: '../OPE-01/ope01.html',
        ope02: '../OPE-02/ope02.html',
        ope03: '../OPE-03/ope03.html',
        fin01: '../FIN-01/fin01.html'
      },
      stu03: {
        stu01: '../STU-01/stu01.html',
        stu03: 'stu03.html',
        aut01: '../AUT-01/aut01.html',
        aut03: '../AUT-03/aut03.html',
        ope01: '../OPE-01/ope01.html',
        ope02: '../OPE-02/ope02.html',
        ope03: '../OPE-03/ope03.html',
        fin01: '../FIN-01/fin01.html'
      },
      aut03: {
        stu01: '../STU-01/stu01.html',
        stu03: '../STU-03/stu03.html',
        aut01: '../AUT-01/aut01.html',
        aut03: 'aut03.html',
        ope01: '../OPE-01/ope01.html',
        ope02: '../OPE-02/ope02.html',
        ope03: '../OPE-03/ope03.html',
        fin01: '../FIN-01/fin01.html'
      },
      ope01: {
        stu01: '../STU-01/stu01.html',
        stu03: '../STU-03/stu03.html',
        aut01: '../AUT-01/aut01.html',
        aut03: '../AUT-03/aut03.html',
        ope01: 'ope01.html',
        ope02: '../OPE-02/ope02.html',
        ope03: '../OPE-03/ope03.html',
        fin01: '../FIN-01/fin01.html'
      },
      ope02: {
        stu01: '../STU-01/stu01.html',
        stu03: '../STU-03/stu03.html',
        aut01: '../AUT-01/aut01.html',
        aut03: '../AUT-03/aut03.html',
        ope01: '../OPE-01/ope01.html',
        ope02: 'ope02.html',
        ope03: '../OPE-03/ope03.html',
        fin01: '../FIN-01/fin01.html'
      },
      ope03: {
        stu01: '../STU-01/stu01.html',
        stu03: '../STU-03/stu03.html',
        aut01: '../AUT-01/aut01.html',
        aut03: '../AUT-03/aut03.html',
        ope01: '../OPE-01/ope01.html',
        ope02: '../OPE-02/ope02.html',
        ope03: 'ope03.html',
        fin01: '../FIN-01/fin01.html'
      },
      fin01: {
        stu01: '../STU-01/stu01.html',
        stu03: '../STU-03/stu03.html',
        aut01: '../AUT-01/aut01.html',
        aut03: '../AUT-03/aut03.html',
        ope01: '../OPE-01/ope01.html',
        ope02: '../OPE-02/ope02.html',
        ope03: '../OPE-03/ope03.html',
        fin01: '../FIN-01/fin01.html',
        fin02: '../FIN-02/fin02.html',
        fin03: '../FIN-03/fin03.html'
      },
      fin02: {
        stu01: '../STU-01/stu01.html',
        stu03: '../STU-03/stu03.html',
        aut01: '../AUT-01/aut01.html',
        aut03: '../AUT-03/aut03.html',
        ope01: '../OPE-01/ope01.html',
        ope02: '../OPE-02/ope02.html',
        ope03: '../OPE-03/ope03.html',
        fin01: '../FIN-01/fin01.html',
        fin02: 'fin02.html',
        fin03: '../FIN-03/fin03.html'
      },
      fin03: {
        stu01: '../STU-01/stu01.html',
        stu03: '../STU-03/stu03.html',
        aut01: '../AUT-01/aut01.html',
        aut03: '../AUT-03/aut03.html',
        ope01: '../OPE-01/ope01.html',
        ope02: '../OPE-02/ope02.html',
        ope03: '../OPE-03/ope03.html',
        fin01: '../FIN-01/fin01.html',
        fin02: '../FIN-02/fin02.html',
        fin03: 'fin03.html'
      },
    };
    return m[page] || m.stu01;
  }

  function applySidebar(role) {
    var page = (document.body && document.body.getAttribute('data-jims-page')) || 'stu01';
    var u = pathMap(page);
    var isAdmin = role && String(role).toLowerCase() === 'admin';
    var studentHref = isAdmin ? u.stu01 : u.stu03;

    document.querySelectorAll('a[title="Hồ sơ học sinh"]').forEach(function (a) {
      a.setAttribute('href', studentHref);
    });

    // OPE screens: Admin -> OPE-01, Teacher/TA -> OPE-02 list
    document.querySelectorAll('a[title="Quản lý lớp học"]').forEach(function (a) {
      a.setAttribute('href', isAdmin ? u.ope01 : u.ope02);
    });
    document.querySelectorAll('a[title="Tài chính"]').forEach(function (a) {
      a.setAttribute('href', u.fin02 || u.fin01 || '../FIN-02/fin02.html');
      a.style.display = isAdmin ? '' : 'none';
    });
    document.querySelectorAll('a[title="Trang chủ"]').forEach(function (a) {
      a.setAttribute('href', studentHref);
    });
    document.querySelectorAll('a[title="Thông báo"]').forEach(function (a) {
      a.setAttribute('href', u.aut03 || '../AUT-03/aut03.html');
    });
    document.querySelectorAll('a[title="Cài đặt"]').forEach(function (a) {
      a.setAttribute('href', u.aut03 || '../AUT-03/aut03.html');
    });

    document.querySelectorAll('.jims-admin-only').forEach(function (el) {
      el.style.display = isAdmin ? '' : 'none';
    });

    var nv = document.querySelector('.sidebar-menu a[title="Nhân viên"]');
    if (nv && !nv.classList.contains('jims-admin-only')) {
      nv.style.display = isAdmin ? '' : 'none';
    }

    // no click blocking: teachers are routed to OPE-02 list.
  }

  var readyResolve;
  window.JIMS = window.JIMS || {};
  window.JIMS.API_BASE = API_BASE;
  window.JIMS.authHeaders = authHeaders;
  window.JIMS.setupDoneKey = function (staffId) {
    return 'JIMS_SETUP_DONE_' + staffId;
  };
  window.JIMS.staffId = null;
  window.JIMS.role = null;
  window.JIMS.ready = new Promise(function (resolve) {
    readyResolve = resolve;
  });
  window.JIMS.handleSessionExpired = handleSessionExpired;

  document.addEventListener('DOMContentLoaded', function () {
    var page = (document.body && document.body.getAttribute('data-jims-page')) || '';
    if (!page) {
      document.body.classList.remove('jims-shell-loading');
      readyResolve(null);
      return;
    }

    var token = localStorage.getItem('JIMS_TOKEN');
    var u = pathMap(page);

    if (!token) {
      window.location.href = '../AUT-02/aut02.html';
      return;
    }

    fetch(API_BASE + '/api/auth/session', {
      method: 'GET',
      credentials: 'include',
      headers: authHeaders()
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (payload) {
        if (!payload || !payload.success) {
          localStorage.removeItem('JIMS_TOKEN');
          handleSessionExpired((payload && payload.message) || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }

        var data = payload.data || {};
        var role = data.role != null ? String(data.role) : '';
        var lower = role.toLowerCase();
        window.JIMS.role = role;
        if (data.staffId != null) {
          window.JIMS.staffId = data.staffId;
        }

        if (page === 'stu01' && lower !== 'admin') {
          window.location.href = u.stu03;
          return;
        }
        if (page === 'aut01' && lower !== 'admin') {
          window.location.href = u.stu03;
          return;
        }
        if (page === 'ope01' && lower !== 'admin') {
          alert('Bạn không có quyền truy cập!');
          window.location.href = u.ope02 || '../OPE-02/ope02.html';
          return;
        }
        if ((page === 'fin01' || page === 'fin02' || page === 'fin03') && lower !== 'admin') {
          alert('Bạn không có quyền truy cập');
          window.location.href = u.ope02 || '../OPE-02/ope02.html';
          return;
        }

        applySidebar(role);
        document.body.classList.remove('jims-shell-loading');
        document.body.classList.add('jims-shell-ready');
        readyResolve(role);
      })
      .catch(function () {
        localStorage.removeItem('JIMS_TOKEN');
        handleSessionExpired(getNetworkFailureMessage());
      });
  });
})();
