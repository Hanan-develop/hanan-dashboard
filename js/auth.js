/* =========================================================
   HANAN DASHBOARD - AUTHENTICATION SYSTEM v2
   Google Sheets backed credentials + localStorage cache
   ========================================================= */

(function () {
    'use strict';

    // ===== CONFIG =====
    var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx2sQwvMTOCeNdiE255oLaoqXUHvdsKrcn423nUIqrwqRtcWTdUL6LPm9VJjVz4M6dE/exec';
    var SECRET_KEY = 'hanan_2026_secret';

    var AUTH_CONFIG = {
        sessionKey: 'hanan_dashboard_session',
        credsCacheKey: 'hanan_creds_cache',
        sessionExpiry: 60 * 60 * 1000,           // 1 hour
        rememberExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
        // Fallback credentials (used if Sheet unreachable AND no cache)
        fallback: { username: 'hanan', password: 'hanan@2026' }
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
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
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
        } catch (e) { return false; }
    }

    function getCachedCreds() {
        try {
            var str = localStorage.getItem(AUTH_CONFIG.credsCacheKey);
            return str ? JSON.parse(str) : null;
        } catch (e) { return null; }
    }

    function setCachedCreds(username, password) {
        try {
            localStorage.setItem(AUTH_CONFIG.credsCacheKey, JSON.stringify({
                username: username,
                password: password,
                cachedAt: Date.now()
            }));
        } catch (e) { }
    }

    // ===== Server Verify Login =====
    function verifyLoginOnServer(username, password) {
        return new Promise(function (resolve) {
            var formData = new FormData();
            formData.append('action', 'verifyLogin');
            formData.append('username', username);
            formData.append('password', password);

            fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
                .then(function (r) { return r.json(); })
                .then(function (res) { resolve(res); })
                .catch(function (err) {
                    console.error('Server verify failed:', err);
                    resolve({ ok: false, error: 'network', offline: true });
                });
        });
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
            } catch (e) { return null; }
        },

        getSessionInfo: function () {
            try {
                return JSON.parse(localStorage.getItem(AUTH_CONFIG.sessionKey));
            } catch (e) { return null; }
        },

        requireAuth: function () {
            if (isLoginPage()) return true;
            if (!isLoggedIn()) {
                window.location.replace('index.html');
                return false;
            }
            return true;
        },

        // Server URL exposed for settings page
        getApiUrl: function () { return GOOGLE_SCRIPT_URL; },
        getSecret: function () { return SECRET_KEY; },

        // Update local cache after password change
        updateCache: function (username, password) {
            setCachedCreds(username, password);
        }
    };

    // ===== INIT =====
    $(document).ready(function () {

        var currentPage = getCurrentPage();

        // ===== Login Page Logic =====
        if (isLoginPage()) {

            // Already logged in? Go to dashboard
            if (isLoggedIn()) {
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

                var username = ($('#username').val() || '').trim();
                var password = $('#password').val() || '';
                var remember = $('#rememberMe').is(':checked');

                if (!username || !password) {
                    showFormError('Please enter username and password.');
                    return;
                }

                var $btn = $('#loginBtn');
                $btn.addClass('loading').prop('disabled', true);

                // Try server first
                verifyLoginOnServer(username, password).then(function (res) {

                    // Server says OK
                    if (res && res.ok) {
                        setCachedCreds(username.toLowerCase(), password);
                        finishLogin(username.toLowerCase(), remember);
                        return;
                    }

                    // Server failed (offline) — check local cache
                    if (res && res.offline) {
                        var cached = getCachedCreds();
                        if (cached &&
                            cached.username === username.toLowerCase() &&
                            cached.password === password) {
                            showToast('Logged in (offline mode)', 'info');
                            finishLogin(username.toLowerCase(), remember);
                            return;
                        }

                        // Try fallback (only if no cache exists)
                        if (!cached &&
                            username.toLowerCase() === AUTH_CONFIG.fallback.username &&
                            password === AUTH_CONFIG.fallback.password) {
                            setCachedCreds(username.toLowerCase(), password);
                            showToast('Logged in (offline mode)', 'info');
                            finishLogin(username.toLowerCase(), remember);
                            return;
                        }

                        $btn.removeClass('loading').prop('disabled', false);
                        showFormError('Cannot connect to server. Check your internet.');
                        return;
                    }

                    // Server says wrong credentials
                    $btn.removeClass('loading').prop('disabled', false);
                    showFormError(res && res.error ? res.error : 'Invalid username or password.');
                    $('.auth-card').css('animation', 'shake 0.4s');
                    setTimeout(function () { $('.auth-card').css('animation', ''); }, 400);
                });
            });

            function finishLogin(username, remember) {
                var success = createSession(username, remember);
                if (!success) {
                    $('#loginBtn').removeClass('loading').prop('disabled', false);
                    showFormError('Failed to create session.');
                    return;
                }
                showToast('Login successful! Redirecting...', 'success');
                setTimeout(function () {
                    window.location.replace('dashboard.html');
                }, 700);
            }

            // Forgot password
            $('.forgot-link').on('click', function (e) {
                e.preventDefault();
                showToast('Contact admin to reset password.', 'info');
            });

            // Enter key
            $('#username, #password').on('keypress', function (e) {
                if (e.which === 13) { $('#loginForm').submit(); }
            });

            setTimeout(function () { $('#username').focus(); }, 300);
        }
    });

})();
