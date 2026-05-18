/* WEBSITE EDITOR */
$(function () {
    if (!HananAuth.requireAuth()) return;

    var FIELDS = ['hero_name', 'hero_tagline', 'hero_subtitle', 'hero_cta_text', 'hero_cta_link', 'hero_avatar',
                  'about_title', 'about_description', 'about_years', 'about_projects', 'about_clients', 'about_satisfaction',
                  'contact_email', 'contact_phone', 'contact_whatsapp', 'contact_location',
                  'social_github', 'social_linkedin', 'social_youtube', 'social_twitter', 'social_instagram', 'social_facebook'];

    function load() {
        fetch(HananAuth.getApiUrl() + '?action=getSiteSettings')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                var s = (res && res.settings) || {};
                FIELDS.forEach(function (f) { $('#' + f).val(s[f] || ''); });
                var av = s.contact_availability || 'available';
                $('input[name="availability"][value="' + av + '"]').prop('checked', true);
            });
    }

    $('.editor-tabs').on('click', '.editor-tab', function () {
        $('.editor-tab').removeClass('active');
        $(this).addClass('active');
        var tab = $(this).data('tab');
        $('.editor-panel').removeClass('active');
        $('.editor-panel[data-panel="' + tab + '"]').addClass('active');
    });

    $('#editorForm').on('submit', function (e) {
        e.preventDefault();
        var $btn = $('button[type="submit"]', this);
        var orig = $btn.html();
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Saving...');

        var fd = new FormData();
        fd.append('action', 'saveSiteSettings');
        fd.append('secret', HananAuth.getSecret());
        FIELDS.forEach(function (f) { fd.append(f, $('#' + f).val() || ''); });
        fd.append('contact_availability', $('input[name="availability"]:checked').val() || 'available');

        fetch(HananAuth.getApiUrl(), { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
                    notify({ message: 'Saved successfully!', type: 'success' });
                } else {
                    notify({ message: 'Error: ' + (res.error || 'Failed'), type: 'error' });
                }
                $btn.prop('disabled', false).html(orig);
            })
            .catch(function () {
                notify({ message: 'Connection error', type: 'error' });
                $btn.prop('disabled', false).html(orig);
            });
    });

    load();
    $('#refreshBtn').on('click', load);
});
