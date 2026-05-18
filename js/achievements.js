/* =========================================================
   ACHIEVEMENTS PAGE - CRUD
   ========================================================= */

(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = HananAuth.getApiUrl();
    var SECRET_KEY = HananAuth.getSecret();
    var allAchievements = [];
    var currentFilter = 'all';

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function loadAchievements() {
        fetch(GOOGLE_SCRIPT_URL + '?action=getAchievements')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                allAchievements = (res && res.achievements) || [];
                renderAchievements();
            })
            .catch(function () {
                $('#achievementsGrid').html('<div class="section-empty"><i class="fa-solid fa-circle-exclamation"></i><h3>Connection Error</h3><p>Could not load achievements</p></div>');
            });
    }

    function renderAchievements() {
        var filtered = allAchievements;
        if (currentFilter === 'visible') filtered = allAchievements.filter(function (a) { return a.visible !== 'no'; });
        else if (currentFilter === 'hidden') filtered = allAchievements.filter(function (a) { return a.visible === 'no'; });

        var visibleCount = allAchievements.filter(function (a) { return a.visible !== 'no'; }).length;
        var hiddenCount = allAchievements.filter(function (a) { return a.visible === 'no'; }).length;

        $('#countAll').text(allAchievements.length);
        $('#countVisible').text(visibleCount);
        $('#countHidden').text(hiddenCount);

        if (filtered.length === 0) {
            $('#achievementsGrid').html(
                '<div class="section-empty">' +
                '<i class="fa-solid fa-trophy"></i>' +
                '<h3>' + (currentFilter === 'hidden' ? 'No hidden achievements' : currentFilter === 'visible' ? 'No visible achievements' : 'No achievements yet') + '</h3>' +
                '<p>Add your first achievement to display on website</p>' +
                '<button class="btn-add-first" onclick="document.getElementById(\'addBtn\').click()"><i class="fa-solid fa-plus"></i> Add First Achievement</button>' +
                '</div>'
            );
            return;
        }

        filtered.sort(function (a, b) {
            return (parseInt(a.orderNum) || 99) - (parseInt(b.orderNum) || 99);
        });

        var html = filtered.map(function (a) {
            var iconClass = (a.icon || 'fa-trophy').indexOf('fa-') === 0 ? 'fa-solid ' + a.icon : a.icon;

            var tagHtml = '';
            if (a.tag) {
                tagHtml = '<span class="sc-badge ' + (a.tag === 'featured' || a.tag === 'major' ? 'featured' : '') + '">' + escapeHtml(a.tag.toUpperCase()) + '</span>';
            }

            var hiddenClass = a.visible === 'no' ? 'hidden' : '';

            return '<div class="section-card ' + hiddenClass + '" style="--card-color: ' + escapeHtml(a.color || '#f9ca24') + ';" data-id="' + a.id + '">' +
                '<div class="sc-header">' +
                    '<div class="sc-icon"><i class="' + iconClass + '"></i></div>' +
                    '<div class="sc-meta">' +
                        '<div class="sc-title">' + escapeHtml(a.title) + '</div>' +
                        '<div style="display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 0.4rem;">' +
                            '<span class="sc-badge">' + escapeHtml(a.year || '2025') + '</span>' +
                            '<span class="sc-badge">' + escapeHtml((a.category || 'milestone').toUpperCase()) + '</span>' +
                            tagHtml +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="sc-description">' + escapeHtml(a.description) + '</div>' +
                '<div class="sc-footer">' +
                    '<span class="sc-tag">Order: #' + (a.orderNum || 1) + '</span>' +
                    '<div class="sc-actions">' +
                        '<button class="sc-btn btn-hide" data-id="' + a.id + '" title="' + (a.visible === 'no' ? 'Show' : 'Hide') + '">' +
                            '<i class="fa-solid fa-' + (a.visible === 'no' ? 'eye' : 'eye-slash') + '"></i></button>' +
                        '<button class="sc-btn btn-edit" data-id="' + a.id + '" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
                        '<button class="sc-btn btn-delete" data-id="' + a.id + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        $('#achievementsGrid').html(html);
    }

    function openModal(ach) {
        if (ach) {
            $('#modalTitle').text('Edit Achievement');
            $('#saveBtnText').text('Update Achievement');
            $('#achId').val(ach.id);
            $('#title').val(ach.title);
            $('#description').val(ach.description);
            $('#year').val(ach.year || '2025');
            $('#category').val(ach.category || 'career');
            $('#icon').val(ach.icon || 'fa-trophy');
            $('#color').val(ach.color || '#f9ca24');
            $('#colorHex').val(ach.color || '#f9ca24');
            $('#orderNum').val(ach.orderNum || 1);
            $('#tag').val(ach.tag || '');

            if (ach.visible === 'no') {
                $('#visibleToggle').removeClass('on');
                $('#visible').val('no');
            } else {
                $('#visibleToggle').addClass('on');
                $('#visible').val('yes');
            }
        } else {
            $('#modalTitle').text('Add Achievement');
            $('#saveBtnText').text('Save Achievement');
            $('#achievementForm')[0].reset();
            $('#achId').val('');
            $('#color').val('#f9ca24');
            $('#colorHex').val('#f9ca24');
            $('#icon').val('fa-trophy');
            $('#year').val('2025');
            $('#visibleToggle').addClass('on');
            $('#visible').val('yes');
        }
        $('#modalOverlay').addClass('open');
    }

    function closeModal() { $('#modalOverlay').removeClass('open'); }

    function saveAchievement(e) {
        e.preventDefault();
        var $btn = $('button[type="submit"]', '#achievementForm');
        var originalText = $btn.html();
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Saving...');

        var fd = new FormData();
        fd.append('action', 'saveAchievement');
        fd.append('secret', SECRET_KEY);
        if ($('#achId').val()) fd.append('id', $('#achId').val());
        fd.append('title', $('#title').val());
        fd.append('description', $('#description').val());
        fd.append('year', $('#year').val() || '2025');
        fd.append('category', $('#category').val() || 'career');
        fd.append('icon', $('#icon').val() || 'fa-trophy');
        fd.append('color', $('#colorHex').val() || '#f9ca24');
        fd.append('orderNum', $('#orderNum').val() || 1);
        fd.append('tag', $('#tag').val() || '');
        fd.append('visible', $('#visible').val() || 'yes');

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    closeModal();
                    try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
                    if (window.notify) notify({ message: 'Achievement saved!', type: 'success' });
                    loadAchievements();
                } else {
                    alert('Error: ' + (res.error || 'Failed'));
                    $btn.prop('disabled', false).html(originalText);
                }
            })
            .catch(function () {
                alert('Connection error');
                $btn.prop('disabled', false).html(originalText);
            });
    }

    function deleteAchievement(id) {
        if (!confirm('Delete this achievement?')) return;
        var fd = new FormData();
        fd.append('action', 'deleteAchievement');
        fd.append('secret', SECRET_KEY);
        fd.append('id', id);
        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
                    if (window.notify) notify({ message: 'Deleted!', type: 'success' });
                    loadAchievements();
                }
            });
    }

    function toggleVisibility(ach) {
        var newVisible = ach.visible === 'no' ? 'yes' : 'no';
        var fd = new FormData();
        fd.append('action', 'saveAchievement');
        fd.append('secret', SECRET_KEY);
        fd.append('id', ach.id);
        fd.append('title', ach.title);
        fd.append('description', ach.description);
        fd.append('year', ach.year);
        fd.append('category', ach.category);
        fd.append('icon', ach.icon);
        fd.append('color', ach.color);
        fd.append('orderNum', ach.orderNum || 1);
        fd.append('tag', ach.tag || '');
        fd.append('visible', newVisible);

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
                    if (window.notify) notify({ message: newVisible === 'yes' ? 'Achievement shown' : 'Achievement hidden', type: 'success' });
                    loadAchievements();
                }
            });
    }

    $(document).ready(function () {
        if (!HananAuth.requireAuth()) return;
        var user = HananAuth.getCurrentUser();
        if (user) $('#sbUserName').text(user.charAt(0).toUpperCase() + user.slice(1));

        loadAchievements();

        $('#addBtn').on('click', function () { openModal(null); });
        $('#refreshBtn').on('click', function () { loadAchievements(); });
        $('#modalClose, #cancelBtn').on('click', closeModal);
        $('#achievementForm').on('submit', saveAchievement);

        $('.section-filter').on('click', 'button', function () {
            $('.section-filter button').removeClass('active');
            $(this).addClass('active');
            currentFilter = $(this).data('filter');
            renderAchievements();
        });

        $('#color').on('input', function () { $('#colorHex').val($(this).val()); });
        $('#colorHex').on('input', function () {
            var val = $(this).val();
            if (/^#[0-9A-F]{6}$/i.test(val)) $('#color').val(val);
        });

        $('#visibleToggle').on('click', function () {
            $(this).toggleClass('on');
            $('#visible').val($(this).hasClass('on') ? 'yes' : 'no');
        });

        $('#achievementsGrid').on('click', '.btn-edit', function () {
            var id = $(this).data('id');
            var ach = allAchievements.find(function (a) { return a.id === id; });
            if (ach) openModal(ach);
        });

        $('#achievementsGrid').on('click', '.btn-delete', function () {
            deleteAchievement($(this).data('id'));
        });

        $('#achievementsGrid').on('click', '.btn-hide', function () {
            var id = $(this).data('id');
            var ach = allAchievements.find(function (a) { return a.id === id; });
            if (ach) toggleVisibility(ach);
        });

        $('#sbToggle').on('click', function () { $('#sidebar').toggleClass('open'); });
        $('#logoutBtn').on('click', function () { if (confirm('Logout?')) HananAuth.logout(); });
    });
})();
