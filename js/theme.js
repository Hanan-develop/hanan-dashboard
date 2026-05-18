/* =========================================================
   HANAN DASHBOARD - THEME TOGGLE + MOBILE
   ========================================================= */

(function () {
    'use strict';

    var THEME_KEY = 'hanan_theme';

    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }

    function getTheme() {
        return localStorage.getItem(THEME_KEY) || 'dark';
    }

    function toggleTheme() {
        var current = getTheme();
        var next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    }

    // Apply theme immediately to prevent flash
    applyTheme(getTheme());

    // Setup on DOM ready
    document.addEventListener('DOMContentLoaded', function () {
        var toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleTheme);
        }

        // Keyboard shortcut T
        document.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 't' || e.key === 'T') {
                toggleTheme();
            }
        });

        // Mobile sidebar toggle
        var sbToggle = document.getElementById('sbToggle');
        var sidebar = document.getElementById('sidebar');
        if (sbToggle && sidebar) {
            sbToggle.addEventListener('click', function (e) {
                e.stopPropagation();
                sidebar.classList.toggle('open');
            });

            // Close on outside click
            document.addEventListener('click', function (e) {
                if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                    if (!sidebar.contains(e.target) && e.target !== sbToggle) {
                        sidebar.classList.remove('open');
                    }
                }
            });
        }

        // Logout button
        var logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                if (confirm('Logout?')) {
                    if (window.HananAuth) HananAuth.logout();
                }
            });
        }
    });
})();
