/* HANAN DASHBOARD - LOGIN */
$(function () {
    if (HananAuth.isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return;
    }

    $('#loginForm').on('submit', function (e) {
        e.preventDefault();
        var u = $('#username').val().trim();
        var p = $('#password').val();
        if (!u || !p) {
            $('#errorMsg').text('Please enter username and password').show();
            return;
        }
        var $btn = $('button[type="submit"]');
        var orig = $btn.html();
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> <span>Signing in...</span>');

        var fd = new FormData();
        fd.append('action', 'verifyLogin');
        fd.append('username', u);
        fd.append('password', p);
        fetch(HananAuth.getApiUrl(), { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    HananAuth.login(res.username || u);
                    window.location.href = 'dashboard.html';
                } else {
                    $('#errorMsg').text(res.error || 'Login failed').show();
                    $btn.prop('disabled', false).html(orig);
                }
            })
            .catch(function () {
                $('#errorMsg').text('Connection error. Try again.').show();
                $btn.prop('disabled', false).html(orig);
            });
    });
});
