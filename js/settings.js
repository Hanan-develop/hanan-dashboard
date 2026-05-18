/* SETTINGS PAGE */
$(function () {
    if (!HananAuth.requireAuth()) return;

    $('#currentUsername').text(HananAuth.getCurrentUser() || 'hanan');

    $('#changeCredsForm').on('submit', function (e) {
        e.preventDefault();
        var cur = $('#currentPassword').val();
        var newUser = $('#newUsername').val().trim();
        var newPwd = $('#newPassword').val();
        var conf = $('#confirmPassword').val();

        $('#formError, #formSuccess').hide();

        if (newPwd.length < 6) {
            $('#formError').text('Password must be at least 6 characters').show();
            return;
        }
        if (newPwd !== conf) {
            $('#formError').text('Passwords do not match').show();
            return;
        }

        var $btn = $('button[type="submit"]', this);
        var orig = $btn.html();
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Updating...');

        var fd = new FormData();
        fd.append('action', 'changeCreds');
        fd.append('currentPassword', cur);
        if (newUser) fd.append('newUsername', newUser);
        fd.append('newPassword', newPwd);

        fetch(HananAuth.getApiUrl(), { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    $('#formSuccess').text('Credentials updated! Please log in again.').show();
                    setTimeout(function () { HananAuth.logout(); }, 2000);
                } else {
                    $('#formError').text(res.error || 'Failed').show();
                    $btn.prop('disabled', false).html(orig);
                }
            })
            .catch(function () {
                $('#formError').text('Connection error').show();
                $btn.prop('disabled', false).html(orig);
            });
    });
});
