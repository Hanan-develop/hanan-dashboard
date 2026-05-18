/* =========================================================
   WEBSITE EDITOR - LOGIC
   ========================================================= */

(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = HananAuth.getApiUrl();
    var SECRET_KEY = HananAuth.getSecret();

    var currentSettings = {};
    var hasUnsavedChanges = false;

    // ===== HELPERS =====

    function notifySuccess(title, msg) {
        if (window.notify) {
            notify({ title: title, message: msg, type: 'success', persist: true });
        }
    }

    function notifyError(msg) {
        if (window.notify) {
            notify({ title: 'Error', message: msg, type: 'error' });
        }
    }

    // ===== FETCH SETTINGS =====

    function fetchSettings() {
        fetch(GOOGLE_SCRIPT_URL + '?action=getSiteSettings')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok) {
                    currentSettings = data.settings || {};
                    populateForms();
                } else {
                    notifyError('Failed to load settings');
                }
            })
            .catch(function (err) {
                console.error('Fetch error:', err);
                notifyError('Connection error');
            });
    }

    function populateForms() {
        // Populate all input fields from settings
        Object.keys(currentSettings).forEach(function (key) {
            var $field = $('#' + key);
            if ($field.length) {
                $field.val(currentSettings[key] || '');
            }
        });

        // Special: availability radio buttons
        var avail = currentSettings.contact_availability || 'available';
        $('input[name="availability"][value="' + avail + '"]').prop('checked', true);
    }

    // ===== SAVE FORM =====

    function saveSection(formId, fields) {
        var $btn = $('#' + formId).find('.btn-save');
        var originalText = $btn.html();

        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> <span>Saving...</span>');

        var formData = new FormData();
        formData.append('action', 'saveSiteSettings');
        formData.append('secret', SECRET_KEY);

        fields.forEach(function (field) {
            var value;
            if (field === 'contact_availability') {
                value = $('input[name="availability"]:checked').val() || 'available';
            } else {
                value = $('#' + field).val() || '';
            }
            formData.append(field, value);
            currentSettings[field] = value;
        });

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                $btn.prop('disabled', false).html(originalText);

                if (res && res.ok) {
                    var sectionName = formId.replace('Form', '');
                    notifySuccess(
                        sectionName.charAt(0).toUpperCase() + sectionName.slice(1) + ' Saved',
                        'Changes will appear on portfolio after sync.'
                    );
                    hasUnsavedChanges = false;
                } else {
                    notifyError(res.error || 'Failed to save');
                }
            })
            .catch(function (err) {
                console.error('Save error:', err);
                $btn.prop('disabled', false).html(originalText);
                notifyError('Connection error');
            });
    }

    // ===== TAB SWITCHING =====

    function switchTab(tabName) {
        $('.ed-tab').removeClass('active');
        $('.ed-tab[data-tab="' + tabName + '"]').addClass('active');

        $('.ed-panel').removeClass('active');
        $('#panel-' + tabName).addClass('active');

        // Update URL hash without scroll
        history.replaceState(null, '', '#' + tabName);
    }

    // ===== INIT =====

    $(document).ready(function () {
        if (!HananAuth.requireAuth()) return;

        var user = HananAuth.getCurrentUser();
        if (user) $('#sbUserName').text(user.charAt(0).toUpperCase() + user.slice(1));

        // Tab switching
        $('.ed-tab').on('click', function () {
            switchTab($(this).data('tab'));
        });

        // Open tab from hash on load
        var hash = window.location.hash.replace('#', '');
        if (hash && ['hero', 'about', 'contact', 'social'].indexOf(hash) > -1) {
            switchTab(hash);
        }

        // Fetch settings
        fetchSettings();

        // Hero form
        $('#heroForm').on('submit', function (e) {
            e.preventDefault();
            saveSection('heroForm', [
                'hero_name', 'hero_tagline', 'hero_subtitle',
                'hero_cta_text', 'hero_cta_link', 'hero_avatar'
            ]);
        });

        // About form
        $('#aboutForm').on('submit', function (e) {
            e.preventDefault();
            saveSection('aboutForm', [
                'about_title', 'about_description',
                'about_years', 'about_projects', 'about_clients', 'about_satisfaction'
            ]);
        });

        // Contact form
        $('#contactForm').on('submit', function (e) {
            e.preventDefault();
            saveSection('contactForm', [
                'contact_email', 'contact_phone', 'contact_whatsapp',
                'contact_location', 'contact_availability'
            ]);
        });

        // Social form
        $('#socialForm').on('submit', function (e) {
            e.preventDefault();
            saveSection('socialForm', [
                'social_github', 'social_linkedin', 'social_youtube',
                'social_twitter', 'social_instagram', 'social_facebook'
            ]);
        });

        // Detect unsaved changes
        $('input, textarea').on('input change', function () {
            hasUnsavedChanges = true;
        });

        // Warn before leaving with unsaved changes
        $(window).on('beforeunload', function (e) {
            if (hasUnsavedChanges) {
                e.preventDefault();
                return e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });

        // Sidebar
        $('#sbToggle').on('click', function () {
            $('#sidebar').toggleClass('open');
        });

        // Logout
        $('#logoutBtn').on('click', function () {
            if (hasUnsavedChanges && !confirm('You have unsaved changes. Logout anyway?')) return;
            if (confirm('Logout?')) HananAuth.logout();
        });
    });

})();
