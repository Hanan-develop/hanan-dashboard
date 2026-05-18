/* =========================================================
   SERVICES PAGE - CRUD Management
   ========================================================= */

(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = HananAuth.getApiUrl();
    var SECRET_KEY = HananAuth.getSecret();
    var allServices = [];
    var currentFilter = 'all';

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function loadServices() {
        fetch(GOOGLE_SCRIPT_URL + '?action=getServices')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                allServices = (res && res.services) || [];
                renderServices();
            })
            .catch(function () {
                $('#servicesGrid').html('<div class="section-empty"><i class="fa-solid fa-circle-exclamation"></i><h3>Connection Error</h3><p>Could not load services</p></div>');
            });
    }

    function renderServices() {
        var filtered = allServices;
        if (currentFilter === 'visible') filtered = allServices.filter(function (s) { return s.visible !== 'no'; });
        else if (currentFilter === 'hidden') filtered = allServices.filter(function (s) { return s.visible === 'no'; });

        var visibleCount = allServices.filter(function (s) { return s.visible !== 'no'; }).length;
        var hiddenCount = allServices.filter(function (s) { return s.visible === 'no'; }).length;

        $('#countAll').text(allServices.length);
        $('#countVisible').text(visibleCount);
        $('#countHidden').text(hiddenCount);

        if (filtered.length === 0) {
            $('#servicesGrid').html(
                '<div class="section-empty">' +
                '<i class="fa-solid fa-briefcase"></i>' +
                '<h3>' + (currentFilter === 'hidden' ? 'No hidden services' : currentFilter === 'visible' ? 'No visible services' : 'No services yet') + '</h3>' +
                '<p>Add your first service to display on website</p>' +
                '<button class="btn-add-first" onclick="document.getElementById(\'addBtn\').click()"><i class="fa-solid fa-plus"></i> Add First Service</button>' +
                '</div>'
            );
            return;
        }

        // Sort by order
        filtered.sort(function (a, b) {
            return (parseInt(a.orderNum) || 99) - (parseInt(b.orderNum) || 99);
        });

        var html = filtered.map(function (s) {
            var iconClass = (s.icon || 'fa-briefcase').indexOf('fa-') === 0 ?
                (s.icon.indexOf('wordpress') !== -1 || s.icon.indexOf('shopify') !== -1 ? 'fa-brands ' + s.icon : 'fa-solid ' + s.icon) :
                s.icon;

            var features = (s.features || '').split('\n').filter(function (f) { return f.trim(); }).slice(0, 5);
            var featuresHtml = features.map(function (f) {
                return '<li><i class="fa-solid fa-check"></i> ' + escapeHtml(f) + '</li>';
            }).join('');

            var tagHtml = '';
            if (s.tag) {
                tagHtml = '<span class="sc-badge ' + (s.tag === 'featured' ? 'featured' : '') + '">' + escapeHtml(s.tag.toUpperCase()) + '</span>';
            }

            var hiddenClass = s.visible === 'no' ? 'hidden' : '';

            return '<div class="section-card ' + hiddenClass + '" style="--card-color: ' + escapeHtml(s.color || '#f9ca24') + ';" data-id="' + s.id + '">' +
                '<div class="sc-header">' +
                    '<div class="sc-icon"><i class="' + iconClass + '"></i></div>' +
                    '<div class="sc-meta">' +
                        '<div class="sc-title">' + escapeHtml(s.title) + '</div>' +
                        tagHtml +
                    '</div>' +
                '</div>' +
                '<div class="sc-description">' + escapeHtml(s.description) + '</div>' +
                (featuresHtml ? '<ul class="sc-features">' + featuresHtml + '</ul>' : '') +
                '<div class="sc-footer">' +
                    '<span class="sc-tag">Order: #' + (s.orderNum || 1) + '</span>' +
                    '<div class="sc-actions">' +
                        '<button class="sc-btn btn-hide" data-id="' + s.id + '" title="' + (s.visible === 'no' ? 'Show' : 'Hide') + '">' +
                            '<i class="fa-solid fa-' + (s.visible === 'no' ? 'eye' : 'eye-slash') + '"></i></button>' +
                        '<button class="sc-btn btn-edit" data-id="' + s.id + '" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
                        '<button class="sc-btn btn-delete" data-id="' + s.id + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        $('#servicesGrid').html(html);
    }

    function openModal(service) {
        if (service) {
            $('#modalTitle').text('Edit Service');
            $('#saveBtnText').text('Update Service');
            $('#serviceId').val(service.id);
            $('#title').val(service.title);
            $('#description').val(service.description);
            $('#icon').val(service.icon || 'fa-briefcase');
            $('#color').val(service.color || '#f9ca24');
            $('#colorHex').val(service.color || '#f9ca24');
            $('#features').val(service.features || '');
            $('#orderNum').val(service.orderNum || 1);
            $('#tag').val(service.tag || '');

            if (service.visible === 'no') {
                $('#visibleToggle').removeClass('on');
                $('#visible').val('no');
            } else {
                $('#visibleToggle').addClass('on');
                $('#visible').val('yes');
            }
        } else {
            $('#modalTitle').text('Add Service');
            $('#saveBtnText').text('Save Service');
            $('#serviceForm')[0].reset();
            $('#serviceId').val('');
            $('#color').val('#f9ca24');
            $('#colorHex').val('#f9ca24');
            $('#icon').val('fa-briefcase');
            $('#visibleToggle').addClass('on');
            $('#visible').val('yes');
        }
        $('#modalOverlay').addClass('open');
    }

    function closeModal() {
        $('#modalOverlay').removeClass('open');
    }

    function saveService(e) {
        e.preventDefault();
        var $btn = $('button[type="submit"]', '#serviceForm');
        var originalText = $btn.html();
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Saving...');

        var fd = new FormData();
        fd.append('action', 'saveService');
        fd.append('secret', SECRET_KEY);
        if ($('#serviceId').val()) fd.append('id', $('#serviceId').val());
        fd.append('title', $('#title').val());
        fd.append('description', $('#description').val());
        fd.append('icon', $('#icon').val() || 'fa-briefcase');
        fd.append('color', $('#colorHex').val() || '#f9ca24');
        fd.append('features', $('#features').val());
        fd.append('orderNum', $('#orderNum').val() || 1);
        fd.append('tag', $('#tag').val() || '');
        fd.append('visible', $('#visible').val() || 'yes');

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    closeModal();
                    try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
                    if (window.notify) notify({ message: 'Service saved!', type: 'success' });
                    loadServices();
                } else {
                    alert('Error: ' + (res.error || 'Failed to save'));
                    $btn.prop('disabled', false).html(originalText);
                }
            })
            .catch(function () {
                alert('Connection error');
                $btn.prop('disabled', false).html(originalText);
            });
    }

    function deleteService(id) {
        if (!confirm('Delete this service?')) return;

        var fd = new FormData();
        fd.append('action', 'deleteService');
        fd.append('secret', SECRET_KEY);
        fd.append('id', id);

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
                    if (window.notify) notify({ message: 'Deleted!', type: 'success' });
                    loadServices();
                } else {
                    alert('Error: ' + (res.error || 'Failed'));
                }
            });
    }

    function toggleVisibility(service) {
        var newVisible = service.visible === 'no' ? 'yes' : 'no';
        var fd = new FormData();
        fd.append('action', 'saveService');
        fd.append('secret', SECRET_KEY);
        fd.append('id', service.id);
        fd.append('title', service.title);
        fd.append('description', service.description);
        fd.append('icon', service.icon);
        fd.append('color', service.color);
        fd.append('features', service.features || '');
        fd.append('orderNum', service.orderNum || 1);
        fd.append('tag', service.tag || '');
        fd.append('visible', newVisible);

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
                    if (window.notify) notify({ message: newVisible === 'yes' ? 'Service shown' : 'Service hidden', type: 'success' });
                    loadServices();
                }
            });
    }

    $(document).ready(function () {
        if (!HananAuth.requireAuth()) return;

        var user = HananAuth.getCurrentUser();
        if (user) $('#sbUserName').text(user.charAt(0).toUpperCase() + user.slice(1));

        loadServices();

        $('#addBtn').on('click', function () { openModal(null); });
        $('#refreshBtn').on('click', function () { loadServices(); });
        $('#modalClose, #cancelBtn').on('click', closeModal);
        $('#serviceForm').on('submit', saveService);

        // Filter buttons
        $('.section-filter').on('click', 'button', function () {
            $('.section-filter button').removeClass('active');
            $(this).addClass('active');
            currentFilter = $(this).data('filter');
            renderServices();
        });

        // Color sync
        $('#color').on('input', function () { $('#colorHex').val($(this).val()); });
        $('#colorHex').on('input', function () {
            var val = $(this).val();
            if (/^#[0-9A-F]{6}$/i.test(val)) $('#color').val(val);
        });

        // Toggle visibility in modal
        $('#visibleToggle').on('click', function () {
            $(this).toggleClass('on');
            $('#visible').val($(this).hasClass('on') ? 'yes' : 'no');
        });

        // Card actions (delegated)
        $('#servicesGrid').on('click', '.btn-edit', function () {
            var id = $(this).data('id');
            var service = allServices.find(function (s) { return s.id === id; });
            if (service) openModal(service);
        });

        $('#servicesGrid').on('click', '.btn-delete', function () {
            deleteService($(this).data('id'));
        });

        $('#servicesGrid').on('click', '.btn-hide', function () {
            var id = $(this).data('id');
            var service = allServices.find(function (s) { return s.id === id; });
            if (service) toggleVisibility(service);
        });

        $('#sbToggle').on('click', function () { $('#sidebar').toggleClass('open'); });
        $('#logoutBtn').on('click', function () { if (confirm('Logout?')) HananAuth.logout(); });
    });
})();
