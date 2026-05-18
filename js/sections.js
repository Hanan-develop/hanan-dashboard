/* =========================================================
   SECTIONS PAGE - Visibility Toggles
   ========================================================= */

(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = HananAuth.getApiUrl();
    var SECRET_KEY = HananAuth.getSecret();

    var visibility = {};
    var saving = false;

    var SECTIONS = [
        { key: 'section_hero', name: 'Hero Section', desc: 'Main introduction at top of page', icon: 'fa-id-card' },
        { key: 'section_about', name: 'About Section', desc: 'Your background and statistics', icon: 'fa-user' },
        { key: 'section_skills', name: 'Skills', desc: 'Your technical skills and expertise', icon: 'fa-code' },
        { key: 'section_services', name: 'Services', desc: 'Services you offer to clients', icon: 'fa-briefcase' },
        { key: 'section_projects', name: 'Projects', desc: 'Your portfolio projects showcase', icon: 'fa-folder-open' },
        { key: 'section_testimonials', name: 'Testimonials', desc: 'Client reviews and feedback', icon: 'fa-star' },
        { key: 'section_education', name: 'Education', desc: 'Your educational background', icon: 'fa-graduation-cap' },
        { key: 'section_achievements', name: 'Achievements', desc: 'Awards and milestones', icon: 'fa-trophy' },
        { key: 'section_whatsnew', name: "What's New", desc: 'Latest updates and timeline', icon: 'fa-bullhorn' },
        { key: 'section_faq', name: 'FAQ', desc: 'Frequently asked questions', icon: 'fa-circle-question' },
        { key: 'section_contact', name: 'Contact Section', desc: 'Contact form for visitors', icon: 'fa-phone' }
    ];

    function notifySuccess(msg) {
        if (window.notify) notify({ message: msg, type: 'success' });
    }

    function notifyError(msg) {
        if (window.notify) notify({ title: 'Error', message: msg, type: 'error' });
    }

    function fetchVisibility() {
        fetch(GOOGLE_SCRIPT_URL + '?action=getSectionVisibility')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok) {
                    visibility = data.visibility || {};
                    renderSections();
                } else {
                    showError(data.error || 'Failed to load');
                }
            })
            .catch(function (err) {
                console.error('Fetch error:', err);
                showError('Connection error');
            });
    }

    function showError(msg) {
        $('#sectionsGrid').html(
            '<div class="empty-state" style="grid-column: 1/-1;">' +
            '<i class="fa-solid fa-triangle-exclamation"></i>' +
            '<h3>Error</h3><p>' + msg + '</p>' +
            '<button class="btn-add-first" onclick="location.reload()">Retry</button>' +
            '</div>'
        );
    }

    function renderSections() {
        var html = SECTIONS.map(function (section) {
            var isOn = visibility[section.key] === 'on' || visibility[section.key] === undefined;

            return (
                '<div class="section-card ' + (isOn ? 'enabled' : 'disabled') + '" data-key="' + section.key + '">' +
                    '<div class="section-card-head">' +
                        '<div class="section-card-icon"><i class="fa-solid ' + section.icon + '"></i></div>' +
                    '</div>' +
                    '<h3>' + section.name + '</h3>' +
                    '<p>' + section.desc + '</p>' +
                    '<div class="section-card-footer">' +
                        '<span class="section-status ' + (isOn ? 'on' : 'off') + '">' +
                            (isOn ? 'VISIBLE' : 'HIDDEN') +
                        '</span>' +
                        '<div class="section-toggle-switch"></div>' +
                    '</div>' +
                '</div>'
            );
        }).join('');

        $('#sectionsGrid').html(html);

        // Bind click on cards
        $('.section-card').on('click', function () {
            if (saving) return;

            var key = $(this).data('key');
            var currentValue = visibility[key] === 'on' || visibility[key] === undefined;
            var newValue = currentValue ? 'off' : 'on';

            toggleSection(key, newValue, $(this));
        });
    }

    function toggleSection(key, newValue, $card) {
        saving = true;

        // Optimistic UI
        var isOn = newValue === 'on';
        $card.toggleClass('enabled', isOn).toggleClass('disabled', !isOn);
        $card.find('.section-status')
            .toggleClass('on', isOn)
            .toggleClass('off', !isOn)
            .text(isOn ? 'VISIBLE' : 'HIDDEN');

        visibility[key] = newValue;

        // Save to server
        var formData = new FormData();
        formData.append('action', 'saveSectionVisibility');
        formData.append('secret', SECRET_KEY);
        formData.append(key, newValue);

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                saving = false;
                if (res && res.ok) {
                    var sectionName = SECTIONS.find(function (s) { return s.key === key; });
                    notifySuccess((sectionName ? sectionName.name : key) + ' ' + (isOn ? 'enabled' : 'disabled'));
                } else {
                    // Revert
                    visibility[key] = isOn ? 'off' : 'on';
                    renderSections();
                    notifyError(res.error || 'Failed to save');
                }
            })
            .catch(function (err) {
                saving = false;
                console.error('Save error:', err);
                // Revert
                visibility[key] = isOn ? 'off' : 'on';
                renderSections();
                notifyError('Connection error');
            });
    }

    // ===== INIT =====
    $(document).ready(function () {
        if (!HananAuth.requireAuth()) return;

        var user = HananAuth.getCurrentUser();
        if (user) $('#sbUserName').text(user.charAt(0).toUpperCase() + user.slice(1));

        fetchVisibility();

        $('#refreshBtn').on('click', function () {
            var $btn = $(this);
            $btn.prop('disabled', true).find('i').addClass('fa-spin');
            fetchVisibility();
            setTimeout(function () { $btn.prop('disabled', false).find('i').removeClass('fa-spin'); }, 1000);
        });

        $('#sbToggle').on('click', function () {
            $('#sidebar').toggleClass('open');
        });

        $('#logoutBtn').on('click', function () {
            if (confirm('Logout?')) HananAuth.logout();
        });
    });

})();
