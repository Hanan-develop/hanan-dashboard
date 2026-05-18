/* SECTIONS PAGE */
$(function () {
    if (!HananAuth.requireAuth()) return;

    var SECTIONS = [
        { key: 'section_hero', name: 'Hero Section', icon: 'fa-house' },
        { key: 'section_about', name: 'About Section', icon: 'fa-user' },
        { key: 'section_skills', name: 'Skills', icon: 'fa-code' },
        { key: 'section_services', name: 'Services', icon: 'fa-briefcase' },
        { key: 'section_projects', name: 'Projects', icon: 'fa-folder-open' },
        { key: 'section_testimonials', name: 'Testimonials', icon: 'fa-star' },
        { key: 'section_education', name: 'Education', icon: 'fa-graduation-cap' },
        { key: 'section_achievements', name: 'Achievements', icon: 'fa-trophy' },
        { key: 'section_whatsnew', name: "What's New", icon: 'fa-bullhorn' },
        { key: 'section_faq', name: 'FAQ', icon: 'fa-question' },
        { key: 'section_contact', name: 'Contact', icon: 'fa-envelope' }
    ];

    var visibility = {};

    function render() {
        var h = SECTIONS.map(function (s) {
            var on = visibility[s.key] !== 'off';
            return '<div class="section-toggle-card">' +
                '<div class="stc-icon"><i class="fa-solid ' + s.icon + '"></i></div>' +
                '<div class="stc-name">' + s.name + '</div>' +
                '<div class="toggle-switch ' + (on ? 'on' : '') + '" data-key="' + s.key + '"></div>' +
                '</div>';
        }).join('');
        $('#sectionsGrid').html(h);
    }

    function load() {
        fetch(HananAuth.getApiUrl() + '?action=getSectionVisibility')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                visibility = (res && res.visibility) || {};
                render();
            });
    }

    $('#sectionsGrid').on('click', '.toggle-switch', function () {
        $(this).toggleClass('on');
        var key = $(this).data('key');
        visibility[key] = $(this).hasClass('on') ? 'on' : 'off';
    });

    $('#saveBtn').on('click', function () {
        var $btn = $(this);
        var orig = $btn.html();
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Saving...');
        var fd = new FormData();
        fd.append('action', 'saveSectionVisibility');
        fd.append('secret', HananAuth.getSecret());
        Object.keys(visibility).forEach(function (k) { fd.append(k, visibility[k]); });
        fetch(HananAuth.getApiUrl(), { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) notify({ message: 'Saved!', type: 'success' });
                else notify({ message: 'Error', type: 'error' });
                $btn.prop('disabled', false).html(orig);
            });
    });

    load();
    $('#refreshBtn').on('click', load);
});
