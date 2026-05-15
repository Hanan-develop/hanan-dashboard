/* =========================================================
   HANAN DASHBOARD - AUTHENTICATION SYSTEM (FIXED)
   ========================================================= */

(function () {
    'use strict';

    // ===== CONFIG =====
    var AUTH_CONFIG = {
        users: {
            'hanan': 'hanan@2026'
        },
        sessionKey: 'hanan_dashboard_session',
        sessionExpiry: 60 * 60 * 1000,           // 1 hour
        rememberExpiry: 7 * 24 * 60 * 60 * 1000  // 7 days
    };

    // ===== HELPERS =====

    function getCurrentPage() {
        var path = window.location.pathname;
        var page = path.substring(path.lastIndexOf('/') + 1).toLowerCase();
        page = page.split('?')[0].split('#')[0];
        if (!page || page === '') page = 'index.html';
        return page;
    }

    function isLoginPage() {
        var page = getCurrentPage();
        return page === 'index.html' || page === '' || page === 'login.html';
    }

    function simpleHash(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash.toString(36);
    }

    function createSession(username, remember) {
        var expiry = Date.now() + (remember ? AUTH_CONFIG.rememberExpiry : AUTH_CONFIG.sessionExpiry);
        var session = {
            user: username,
            token: simpleHash(username + Date.now() + Math.random()),
            expires: expiry,
            remember: !!remember,
            created: Date.now()
        };
        try {
            localStorage.setItem(AUTH_CONFIG.sessionKey, JSON.stringify(session));
            return true;
        } catch (e) {
            console.error('Session creation failed:', e);
            return false;
        }
    }

    function isLoggedIn() {
        try {
            var sessionStr = localStorage.getItem(AUTH_CONFIG.sessionKey);
            if (!sessionStr) return false;

            var session = JSON.parse(sessionStr);
            if (!session || !session.user || !session.expires) return false;

            if (Date.now() > session.expires) {
                localStorage.removeItem(AUTH_CONFIG.sessionKey);
                return false;
            }

            return true;
        } catch (e) {
            console.error('Session check error:', e);
            return false;
        }
    }

    function validateCredentials(username, password) {
        username = (username || '').trim().toLowerCase();
        password = (password || '').trim();

        if (!username || !password) {
            return { ok: false, error: 'Please enter username and password.' };
        }

        var validPassword = AUTH_CONFIG.users[username];
        if (!validPassword || validPassword !== password) {
            return { ok: false, error: 'Invalid username or password.' };
        }

        return { ok: true };
    }

    function showToast(message, type) {
        type = type || 'info';
        $('.toast').remove();
        var $toast = $('<div class="toast ' + type + '"></div>').text(message);
        $('body').append($toast);
        setTimeout(function () { $toast.addClass('show'); }, 50);
        setTimeout(function () {
            $toast.removeClass('show');
            setTimeout(function () { $toast.remove(); }, 400);
        }, 3000);
    }

    function showFormError(message) {
        var $error = $('#formError');
        if ($error.length === 0) return;
        $error.text(message).addClass('show');
        setTimeout(function () { $error.removeClass('show'); }, 5000);
    }

    // ===== EXPORT TO GLOBAL =====
    window.HananAuth = {
        isLoggedIn: isLoggedIn,

        logout: function () {
            localStorage.removeItem(AUTH_CONFIG.sessionKey);
            window.location.replace('index.html');
        },

        getCurrentUser: function () {
            try {
                var session = JSON.parse(localStorage.getItem(AUTH_CONFIG.sessionKey));
                return session ? session.user : null;
            } catch (e) {
                return null;
            }
        },

        getSessionInfo: function () {
            try {
                return JSON.parse(localStorage.getItem(AUTH_CONFIG.sessionKey));
            } catch (e) {
                return null;
            }
        },

        requireAuth: function () {
            // Safety: never redirect FROM login page
            if (isLoginPage()) return true;

            if (!isLoggedIn()) {
                window.location.replace('index.html');
                return false;
            }
            return true;
        }
    };

    // ===== INIT =====
    $(document).ready(function () {

        var currentPage = getCurrentPage();
        console.log('[Auth] Current page:', currentPage);
        console.log('[Auth] Is login page:', isLoginPage());
        console.log('[Auth] Is logged in:', isLoggedIn());

        // ===== Login Page Logic =====
        if (isLoginPage()) {

            // If already logged in, go to dashboard
            if (isLoggedIn()) {
                console.log('[Auth] Already logged in, redirecting to dashboard');
                window.location.replace('dashboard.html');
                return;
            }

            // Password toggle
            $('#togglePwd').on('click', function () {
                var $pwd = $('#password');
                var $icon = $(this).find('i');
                if ($pwd.attr('type') === 'password') {
                    $pwd.attr('type', 'text');
                    $icon.removeClass('fa-eye').addClass('fa-eye-slash');
                } else {
                    $pwd.attr('type', 'password');
                    $icon.removeClass('fa-eye-slash').addClass('fa-eye');
                }
            });

            // Form submit
            $('#loginForm').on('submit', function (e) {
                e.preventDefault();

                var username = $('#username').val();
                var password = $('#password').val();
                var remember = $('#rememberMe').is(':checked');

                var result = validateCredentials(username, password);

                if (!result.ok) {
                    showFormError(result.error);
                    $('.auth-card').css('animation', 'shake 0.4s');
                    setTimeout(function () { $('.auth-card').css('animation', ''); }, 400);
                    return;
                }

                var $btn = $('#loginBtn');
                $btn.addClass('loading').prop('disabled', true);

                setTimeout(function () {
                    var success = createSession(username.trim().toLowerCase(), remember);

                    if (!success) {
                        $btn.removeClass('loading').prop('disabled', false);
                        showFormError('Failed to create session. Please enable cookies/storage.');
                        return;
                    }

                    showToast('Login successful! Redirecting...', 'success');

                    setTimeout(function () {
                        window.location.replace('dashboard.html');
                    }, 800);

                }, 500);
            });

            // Forgot password
            $('.forgot-link').on('click', function (e) {
                e.preventDefault();
                showToast('Demo: Username "hanan", Password "hanan@2026"', 'info');
            });

            // Enter key
            $('#username, #password').on('keypress', function (e) {
                if (e.which === 13) {
                    $('#loginForm').submit();
                }
            });

            setTimeout(function () { $('#username').focus(); }, 300);
        }
    });

})();
