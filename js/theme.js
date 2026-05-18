/* HANAN DASHBOARD - THEME + MOBILE */
(function () {
    'use strict';
    var THEME_KEY = 'hanan_theme';

    function applyTheme(t) {
        if (t === 'light') document.body.classList.add('light-theme');
        else document.body.classList.remove('light-theme');
    }
    function getTheme() { return localStorage.getItem(THEME_KEY) || 'dark'; }
    function toggleTheme() {
        var next = getTheme() === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    }
    applyTheme(getTheme());

    document.addEventListener('DOMContentLoaded', function () {
        var t = document.getElementById('themeToggle');
        if (t) t.addEventListener('click', toggleTheme);

        var sbToggle = document.getElementById('sbToggle');
        var sidebar = document.getElementById('sidebar');
        if (sbToggle && sidebar) {
            sbToggle.addEventListener('click', function (e) {
                e.stopPropagation();
                sidebar.classList.toggle('open');
            });
            document.addEventListener('click', function (e) {
                if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                    if (!sidebar.contains(e.target) && e.target !== sbToggle) {
                        sidebar.classList.remove('open');
                    }
                }
            });
        }

        var logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                if (confirm('Logout?') && window.HananAuth) HananAuth.logout();
            });
        }
    });
})();
