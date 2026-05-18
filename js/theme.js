/* =========================================================
   DASHBOARD - THEME TOGGLE SYSTEM
   ========================================================= */

(function () {
    'use strict';

    var THEME_KEY = 'hanan_dashboard_theme';

    function getTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || 'dark';
        } catch (e) {
            return 'dark';
        }
    }

    function setTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) { }

        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }

    function toggleTheme() {
        var current = getTheme();
        var next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);

        // Show toast notification
        showThemeToast(next);
    }

    function showThemeToast(theme) {
        $('.toast').remove();
        var msg = theme === 'light' ? 'Light mode activated' : 'Dark mode activated';
        var icon = theme === 'light' ? 'fa-sun' : 'fa-moon';

        var $toast = $('<div class="toast"><i class="fa-solid ' + icon + '"></i> ' + msg + '</div>');
        $('body').append($toast);

        setTimeout(function () { $toast.addClass('show'); }, 50);
        setTimeout(function () {
            $toast.removeClass('show');
            setTimeout(function () { $toast.remove(); }, 400);
        }, 2000);
    }

    // Apply theme immediately (prevent flash)
    setTheme(getTheme());

    // Initialize toggle button when DOM ready
    $(document).ready(function () {
        $(document).on('click', '#themeToggle', function () {
            toggleTheme();
        });

        // Keyboard shortcut: T
        $(document).on('keydown', function (e) {
            // Skip if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            if (e.key === 't' || e.key === 'T') {
                toggleTheme();
            }
        });
    });

    // Export to global
    window.HananTheme = {
        get: getTheme,
        set: setTheme,
        toggle: toggleTheme
    };

})();
