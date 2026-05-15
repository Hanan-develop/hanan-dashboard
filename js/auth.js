/* =========================================================
   HANAN DASHBOARD - AUTHENTICATION SYSTEM
   ========================================================= */

(function () {
    'use strict';

    // ===== CONFIG =====
    var AUTH_CONFIG = {
        // Default credentials (change these or add hash-based auth later)
        users: {
            'hanan': 'hanan@2026'
        },
        // Session settings
        sessionKey: 'hanan_dashboard_session',
        rememberKey: 'hanan_dashboard_remember',
        // Session expiry: 1 hour normal, 7 days with "Remember me"
        sessionExpiry: 60 * 60 * 1000,           // 1 hour
        rememberExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
        // Redirect after login
        redirectUrl: 'dashboard.html'
    };

    // ===== HELPERS =====

    /**
     * Simple hash (NOT cryptographically secure, but sufficient for demo)
     * For real security, use server-side authentication
     */
    function simpleHash(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash.toString(36);
    }

    /**
     * Create a session
     */
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
            console.error('Failed to create session:', e);
            return false;
        }
    }

    /**
     * Check if currently logged in
     */
    function isLoggedIn() {
        try {
            var sessionStr = localStorage.getItem(AUTH_CONFIG.sessionKey);
            if (!sessionStr) return false;

            var session = JSON.parse(sessionStr);
            if (!session || !session.user || !session.expires) return false;

            // Check if expired
            if (Date.now() > session.expires) {
                localStorage.removeItem(AUTH_CONFIG.sessionKey);
                return false;
            }

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Validate credentials
     */
    function validateCredentials(username, password) {
        username = (username || '').trim().toLowerCase();
        password = (password || '').trim();

        if (!username || !password) {
            return { ok: false, error: 'Please enter username and password.' };
        }

        var validPassword = AUTH_CONFIG.users[username];
        if (!validPassword) {
            return { ok: false, error: 'Invalid username or password.' };
        }

        if (validPassword !== password) {
            return { ok: false, error: 'Invalid username or password.' };
        }

        return { ok: true };
    }

    /**
     * Toast notification
     */
    function showToast(message, type) {
        type = type || 'info';
        // Remove existing toast
        $('.toast').remove();

        var $toast = $('<div class="toast ' + type + '"></div>').text(message);
        $('body').append($toast);

        setTimeout(function () { $toast.addClass('show'); }, 50);
        setTimeout(function () {
            $toast.removeClass('show');
            setTimeout(function () { $toast.remove(); }, 400);
        }, 3000);
    }

    /**
     * Show error in form
     */
    function showFormError(message) {
        var $error = $('#formError');
        $error.text(message).addClass('show');
        setTimeout(function () { $error.removeClass('show'); }, 5000);
    }

    // ===== INIT =====

    $(document).ready(function () {

        // If already logged in, redirect to dashboard
        if (isLoggedIn()) {
            window.location.href = AUTH_CONFIG.redirectUrl;
            return;
        }

        // ===== Password toggle =====
        $('#togglePwd').on('click', function () {
            var $pwd = $('#password');
            var $icon = $(this).find('i');
            if ($pwd.attr('type') === 'password') {
                $pwd.attr('type', 'text');
                $icon.removeClass('fa-eye').addClass('fa-eye-slash');
                $(this).attr('aria-label', 'Hide password');
            } else {
                $pwd.attr('type', 'password');
                $icon.removeClass('fa-eye-slash').addClass('fa-eye');
                $(this).attr('aria-label', 'Show password');
            }
        });

        // ===== Form submit =====
        $('#loginForm').on('submit', function (e) {
            e.preventDefault();

            var username = $('#username').val();
            var password = $('#password').val();
            var remember = $('#rememberMe').is(':checked');

            // Validate
            var result = validateCredentials(username, password);

            if (!result.ok) {
                showFormError(result.error);
                // Shake the card on error
                $('.auth-card').css('animation', 'shake 0.4s');
                setTimeout(function () { $('.auth-card').css('animation', ''); }, 400);
                return;
            }

            // Show loading state
            var $btn = $('#loginBtn');
            $btn.addClass('loading').prop('disabled', true);

            // Simulate small delay (better UX)
            setTimeout(function () {

                // Create session
                var success = createSession(username.trim().toLowerCase(), remember);

                if (!success) {
                    $btn.removeClass('loading').prop('disabled', false);
                    showFormError('Failed to create session. Please enable cookies/storage.');
                    return;
                }

                // Show success toast
                showToast('Login successful! Redirecting...', 'success');

                // Redirect
                setTimeout(function () {
                    window.location.href = AUTH_CONFIG.redirectUrl;
                }, 800);

            }, 600);
        });

        // ===== Forgot password (demo) =====
        $('.forgot-link').on('click', function (e) {
            e.preventDefault();
            showToast('Demo mode: Password is hanan@2026', 'info');
        });

        // ===== Enter key handling =====
        $('#username, #password').on('keypress', function (e) {
            if (e.which === 13) {
                $('#loginForm').submit();
            }
        });

        // ===== Auto-focus username =====
        setTimeout(function () { $('#username').focus(); }, 300);

    });

    // ===== Export to global (for use in other pages) =====
    window.HananAuth = {
        isLoggedIn: isLoggedIn,

        logout: function () {
            localStorage.removeItem(AUTH_CONFIG.sessionKey);
            window.location.href = 'index.html';
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

        // Use this on dashboard pages to enforce login
        requireAuth: function () {
            if (!isLoggedIn()) {
                window.location.href = 'index.html';
                return false;
            }
            return true;
        }
    };

})();
