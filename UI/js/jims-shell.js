/**
 * J-IMS shared shell: session check, role-based sidebar links, hide Admin-only UI for Teacher/TA.
 * Requires: <body data-jims-page="aut01|stu01|stu03|aut03" class="jims-shell-loading">
 * Load before page-specific *.js
 */
(function () {
  var API_BASE = 'http://127.0.0.1:8080';

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
        aut03: '../AUT-03/aut03.html'
      },
      stu01: {
        stu01: 'stu01.html',
        stu03: '../STU-03/stu03.html',
        aut01: '../AUT-01/aut01.html',
        aut03: '../AUT-03/aut03.html'
      },
      stu03: {
        stu01: '../STU-01/stu01.html',
        stu03: 'stu03.html',
        aut01: '../AUT-01/aut01.html',
        aut03: '../AUT-03/aut03.html'
      },
      aut03: {
        stu01: '../STU-01/stu01.html',
        stu03: '../STU-03/stu03.html',
        aut01: '../AUT-01/aut01.html',
        aut03: 'aut03.html'
      }
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

    document.querySelectorAll('.jims-admin-only').forEach(function (el) {
      el.style.display = isAdmin ? '' : 'none';
    });

    var nv = document.querySelector('.sidebar-menu a[title="Nhân viên"]');
    if (nv && !nv.classList.contains('jims-admin-only')) {
      nv.style.display = isAdmin ? '' : 'none';
    }
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
          window.location.href = '../AUT-02/aut02.html';
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

        applySidebar(role);
        document.body.classList.remove('jims-shell-loading');
        document.body.classList.add('jims-shell-ready');
        readyResolve(role);
      })
      .catch(function () {
        localStorage.removeItem('JIMS_TOKEN');
        window.location.href = '../AUT-02/aut02.html';
      });
  });
})();
