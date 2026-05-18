/* =========================================================
   HANAN DASHBOARD - SETTINGS PAGE
   Change username/password with Google Sheet sync
   ========================================================= */

(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = HananAuth.getApiUrl();

    // Format date
    function formatDate(timestamp) {
        if (!timestamp) return '—';
        var d = new Date(timestamp);
        return d.toLocaleDateString('en-US', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    }

    // Calculate password strength (0-4)
    function passwordStrength(pwd) {
        if (!pwd) return 0;
        var score = 0;
        if (pwd.length >= 6) score++;
        if (pwd.length >= 10) score++;
        if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return Math.min(score, 4);
    }

    function updateStrengthUI(pwd) {
        var score = passwordStrength(pwd);
        var $bars = $('.pwd-strength-bar');
        var $label = $('#strengthLabel');

        $bars.removeClass('weak medium strong');

        if (!pwd) {
            $label.text('Password strength').css('color', 'var(--text-muted)');
            return;
        }

        var labels = ['Very weak', 'Weak', 'Medium', 'Strong', 'Very strong'];
        var colors = ['#ef4444', '#ef4444', '#f59e0b', '#22c55e', '#22c55e'];
        var classes = ['weak', 'weak', 'medium', 'strong', 'strong'];

        for (var i = 0; i < score; i++) {
            $bars.eq(i).addClass(classes[score - 1]);
        }

        $label.text(labels[score - 1]).css('color', colors[score - 1]);
    }

    function showError(msg) {
        $('#formError').text(msg).addClass('show');
        setTimeout(function () { $('#formError').removeClass('show'); }, 6000);
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
        }, 4000);
    }

    function changeCredentials(currentPassword, newUsername, newPassword) {
        return new Promise(function (resolve) {
            var formData = new FormData();
            formData.append('action', 'changeCreds');
            formData.append('currentPassword', currentPassword);
            formData.append('newUsername', newUsername);
            formData.append('newPassword', newPassword);

            fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
                .then(function (r) { return r.json(); })
                .then(function (res) { resolve(res); })
                .catch(function (err) {
                    console.error('Change creds error:', err);
                    resolve({ ok: false, error: 'Network error. Please try again.' });
                });
        });
    }

    // ===== INIT =====
    $(document).ready(function () {

        if (!HananAuth.requireAuth()) return;

        // ===== Sidebar / Logout =====
        $('#sbToggle').on('click', function () {
            $('#sidebar').toggleClass('open');
        });

        $('#logoutBtn').on('click', function () {
            if (confirm('Are you sure you want to logout?')) {
                HananAuth.logout();
            }
        });

        // ===== Show current user info =====
        var user = HananAuth.getCurrentUser();
        var session = HananAuth.getSessionInfo();

        $('#sbUserName').text(user ? user.charAt(0).toUpperCase() + user.slice(1) : 'User');
        $('#currentUsername').text(user || '—');
        $('#newUsername').val(user || '');

        if (session) {
            $('#sessionType').text(session.remember ? 'Remembered (7 days)' : 'Standard (1 hour)');
            $('#lastLogin').text(formatDate(session.created));
        }

        // ===== Password toggle (multiple fields) =====
        $('.toggle-pwd').on('click', function () {
            var target = $(this).data('target');
            var $field = $('#' + target);
            var $icon = $(this).find('i');

            if ($field.attr('type') === 'password') {
                $field.attr('type', 'text');
                $icon.removeClass('fa-eye').addClass('fa-eye-slash');
            } else {
                $field.attr('type', 'password');
                $icon.removeClass('fa-eye-slash').addClass('fa-eye');
            }
        });

        // ===== Password strength meter =====
        $('#newPassword').on('input', function () {
            updateStrengthUI($(this).val());
        });

        // ===== Change credentials form =====
        $('#changeForm').on('submit', function (e) {
            e.preventDefault();

            var currentPassword = $('#currentPassword').val();
            var newUsername = $('#newUsername').val().trim();
            var newPassword = $('#newPassword').val();
            var confirmPassword = $('#confirmPassword').val();

            // Validation
            if (!currentPassword) {
                showError('Please enter your current password.');
                return;
            }

            if (newUsername.length < 3) {
                showError('Username must be at least 3 characters.');
                return;
            }

            if (newPassword.length < 6) {
                showError('New password must be at least 6 characters.');
                return;
            }

            if (newPassword !== confirmPassword) {
                showError('Passwords do not match.');
                return;
            }

            if (passwordStrength(newPassword) < 2) {
                if (!confirm('Your password is weak. Continue anyway?')) {
                    return;
                }
            }

            // Submit
            var $btn = $('#saveBtn');
            $btn.prop('disabled', true);
            $btn.find('i.fa-check').hide();
            $btn.find('.btn-spinner').show().addClass('fa-spin');

            changeCredentials(currentPassword, newUsername, newPassword).then(function (res) {

                $btn.prop('disabled', false);
                $btn.find('i.fa-check').show();
                $btn.find('.btn-spinner').hide();

                if (res && res.ok) {
                    // Update local cache
                    HananAuth.updateCache(newUsername.toLowerCase(), newPassword);

                    showToast('Credentials updated successfully!', 'success');

                    // Reset form
                    $('#changeForm')[0].reset();
                    $('#newUsername').val(newUsername);
                    updateStrengthUI('');

                    // Update displayed username
                    $('#currentUsername').text(newUsername);
                    $('#sbUserName').text(newUsername.charAt(0).toUpperCase() + newUsername.slice(1));

                    // Optionally logout (force re-login with new credentials)
                    if (confirm('Credentials changed! Would you like to logout and login with new credentials?')) {
                        setTimeout(function () { HananAuth.logout(); }, 500);
                    }
                } else {
                    showError(res && res.error ? res.error : 'Failed to update credentials.');
                }
            });
        });

        // ===== Force logout =====
        $('#forceLogout').on('click', function () {
            if (confirm('This will logout you and clear all cached data. Continue?')) {
                try {
                    localStorage.removeItem('hanan_creds_cache');
                } catch (e) { }
                HananAuth.logout();
            }
        });

    });

})();
