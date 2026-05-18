/* =========================================================
   SKILLS PAGE - FULL CRUD
   ========================================================= */

(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = HananAuth.getApiUrl();
    var SECRET_KEY = HananAuth.getSecret();

    var allSkills = [];
    var currentFilter = 'all';
    var currentSearch = '';
    var editingId = null;

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function showFormError(msg) {
        $('#formError').text(msg).addClass('show');
        setTimeout(function () { $('#formError').removeClass('show'); }, 5000);
    }

    function fetchSkills() {
        $('#skillsGrid').html(
            '<div class="loading-state" style="grid-column:1/-1;">' +
            '<div class="loader-spinner"></div>' +
            '<p>Loading skills...</p></div>'
        );

        fetch(GOOGLE_SCRIPT_URL + '?action=getSkills')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok) {
                    allSkills = data.skills || [];
                    updateStats();
                    updateCategoryFilters();
                    renderSkills();
                } else {
                    showError(data.error || 'Failed to load');
                }
            })
            .catch(function (err) {
                console.error('Fetch error:', err);
                showError('Connection error. Make sure Apps Script v5 is deployed.');
            });
    }

    function showError(msg) {
        $('#skillsGrid').html(
            '<div class="empty-state">' +
            '<i class="fa-solid fa-triangle-exclamation"></i>' +
            '<h3>Error</h3><p>' + escapeHtml(msg) + '</p>' +
            '<button class="btn-add-first" onclick="location.reload()">Retry</button>' +
            '</div>'
        );
    }

    function updateStats() {
        var categories = {};
        var expertCount = 0;
        allSkills.forEach(function (s) {
            if (s.category) categories[s.category] = true;
            if (s.level === 'Expert' || parseInt(s.percent) >= 90) expertCount++;
        });
        $('#totalCount').text(allSkills.length);
        $('#expertCount').text(expertCount);
        $('#categoryCount').text(Object.keys(categories).length);
    }

    function updateCategoryFilters() {
        var categories = {};
        allSkills.forEach(function (s) {
            if (s.category) categories[s.category] = (categories[s.category] || 0) + 1;
        });

        var html = '<button class="fb ' + (currentFilter === 'all' ? 'active' : '') + '" data-filter="all">All</button>';
        Object.keys(categories).forEach(function (cat) {
            html += '<button class="fb ' + (currentFilter === cat ? 'active' : '') + '" data-filter="' + escapeHtml(cat) + '">' + escapeHtml(cat) + '</button>';
        });

        $('#categoryFilters').html(html);
    }

    function renderSkills() {
        var filtered = allSkills.filter(function (s) {
            if (currentFilter !== 'all' && s.category !== currentFilter) return false;
            if (currentSearch) {
                var q = currentSearch.toLowerCase();
                var match = (s.name || '').toLowerCase().indexOf(q) > -1 ||
                            (s.category || '').toLowerCase().indexOf(q) > -1;
                if (!match) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            var msg = allSkills.length === 0
                ? 'Add your first skill to showcase your expertise!'
                : 'No skills match your filter.';

            $('#skillsGrid').html(
                '<div class="empty-state">' +
                '<i class="fa-solid fa-code"></i>' +
                '<h3>No skills yet</h3>' +
                '<p>' + msg + '</p>' +
                (allSkills.length === 0 ? '<button class="btn-add-first" id="emptyAddBtn"><i class="fa-solid fa-plus"></i> Add First Skill</button>' : '') +
                '</div>'
            );
            return;
        }

        var html = filtered.map(function (s) {
            var iconClass = (s.icon || 'fa-code').indexOf('fa-') === 0 ? 'fa-solid ' + s.icon : s.icon;
            var levelClass = (s.level || 'Beginner').toLowerCase();
            var percent = parseInt(s.percent) || 0;

            return (
                '<div class="skill-card" style="--skill-color: ' + escapeHtml(s.color || '#f9ca24') + ';">' +
                    '<div class="skill-actions-overlay">' +
                        '<button class="proj-action-btn edit" data-edit="' + s.id + '" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
                        '<button class="proj-action-btn delete" data-delete="' + s.id + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                    '<div class="skill-head">' +
                        '<div class="skill-icon"><i class="' + iconClass + '"></i></div>' +
                        '<div class="skill-info">' +
                            '<div class="skill-name">' + escapeHtml(s.name) + '</div>' +
                            (s.category ? '<span class="skill-category">' + escapeHtml(s.category) + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                    '<div class="skill-level">' +
                        '<span class="skill-level-label">Proficiency</span>' +
                        '<span class="skill-level-value">' + percent + '%</span>' +
                    '</div>' +
                    '<div class="skill-progress">' +
                        '<div class="skill-progress-fill" style="width: ' + percent + '%;"></div>' +
                    '</div>' +
                    '<span class="skill-badge ' + levelClass + '">' + escapeHtml(s.level || 'Beginner') + '</span>' +
                '</div>'
            );
        }).join('');

        $('#skillsGrid').html(html);

        $('.proj-action-btn.edit').on('click', function (e) {
            e.stopPropagation();
            openEditModal($(this).data('edit'));
        });
        $('.proj-action-btn.delete').on('click', function (e) {
            e.stopPropagation();
            confirmDelete($(this).data('delete'));
        });
    }

    function setLevel(level) {
        $('input[name="level"][value="' + level + '"]').prop('checked', true);

        // Auto-set percentage suggestion
        var pcts = { 'Beginner': 25, 'Intermediate': 55, 'Advanced': 80, 'Expert': 95 };
        if (pcts[level]) {
            $('#skillPercent').val(pcts[level]);
            $('#percentDisplay').text(pcts[level]);
        }
    }

    function openAddModal() {
        editingId = null;
        $('#modalTitle').text('Add New Skill');
        $('#skillForm')[0].reset();
        $('#skillId').val('');
        $('#skillIcon').val('fa-code');
        $('#skillColor').val('#f9ca24');
        $('#skillColorPicker').val('#f9ca24');
        $('#skillPercent').val(75);
        $('#percentDisplay').text(75);
        setLevel('Intermediate');
        $('#skillModal').addClass('show');
        setTimeout(function () { $('#skillName').focus(); }, 300);
    }

    function openEditModal(id) {
        var s = allSkills.find(function (x) { return x.id === id; });
        if (!s) return;

        editingId = id;
        $('#modalTitle').text('Edit Skill');
        $('#skillId').val(s.id);
        $('#skillName').val(s.name || '');
        $('#skillCategory').val(s.category || '');
        $('#skillIcon').val(s.icon || 'fa-code');
        $('#skillColor').val(s.color || '#f9ca24');
        $('#skillColorPicker').val(s.color || '#f9ca24');
        $('#skillPercent').val(s.percent || 75);
        $('#percentDisplay').text(s.percent || 75);
        setLevel(s.level || 'Intermediate');
        $('#skillModal').addClass('show');
    }

    function closeModal() {
        $('#skillModal').removeClass('show');
        editingId = null;
    }

    function saveSkill() {
        var name = $('#skillName').val().trim();
        var category = $('#skillCategory').val().trim();
        var icon = $('#skillIcon').val().trim() || 'fa-code';
        var color = $('#skillColor').val().trim() || '#f9ca24';
        var level = $('input[name="level"]:checked').val() || 'Intermediate';
        var percent = parseInt($('#skillPercent').val()) || 75;

        if (!name) { showFormError('Skill name is required'); return; }
        if (!category) { showFormError('Category is required'); return; }

        var $btn = $('#saveBtn');
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> <span>Saving...</span>');

        var formData = new FormData();
        formData.append('action', 'saveSkill');
        formData.append('secret', SECRET_KEY);
        if (editingId) formData.append('id', editingId);
        formData.append('name', name);
        formData.append('category', category);
        formData.append('icon', icon);
        formData.append('color', color);
        formData.append('level', level);
        formData.append('percent', percent);

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                $btn.prop('disabled', false).html('<i class="fa-solid fa-check"></i> <span>Save Skill</span>');

                if (res && res.ok) {
                    if (window.notify) {
                        notify({
                            title: editingId ? 'Skill Updated' : 'Skill Added',
                            message: name + ' saved successfully.',
                            type: 'success',
                            persist: true
                        });
                    }
                    closeModal();
                    fetchSkills();
                } else {
                    showFormError(res.error || 'Failed to save');
                }
            })
            .catch(function (err) {
                console.error('Save error:', err);
                $btn.prop('disabled', false).html('<i class="fa-solid fa-check"></i> <span>Save Skill</span>');
                showFormError('Connection error');
            });
    }

    function confirmDelete(id) {
        var s = allSkills.find(function (x) { return x.id === id; });
        if (!s) return;

        var $modal = $(
            '<div class="modal show">' +
                '<div class="modal-backdrop" data-confirm-close></div>' +
                '<div class="modal-card confirm-modal" style="max-width: 44rem;">' +
                    '<div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
                    '<h2>Delete Skill?</h2>' +
                    '<p>Delete <strong>"' + escapeHtml(s.name) + '"</strong>? This cannot be undone.</p>' +
                    '<div class="confirm-actions">' +
                        '<button class="btn-cancel" data-confirm-close>Cancel</button>' +
                        '<button class="btn-danger" id="confirmDeleteBtn"><i class="fa-solid fa-trash"></i> Delete</button>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );

        $('body').append($modal);
        $modal.on('click', '[data-confirm-close]', function () { $modal.remove(); });

        $modal.find('#confirmDeleteBtn').on('click', function () {
            var $btn = $(this);
            $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Deleting...');

            var formData = new FormData();
            formData.append('action', 'deleteSkill');
            formData.append('secret', SECRET_KEY);
            formData.append('id', id);

            fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    $modal.remove();
                    if (res && res.ok) {
                        allSkills = allSkills.filter(function (x) { return x.id !== id; });
                        updateStats();
                        updateCategoryFilters();
                        renderSkills();
                        if (window.notify) notify({ title: 'Skill Deleted', message: s.name + ' removed.', type: 'success', persist: true });
                    } else {
                        if (window.notify) notify({ message: res.error || 'Failed to delete', type: 'error' });
                    }
                })
                .catch(function () {
                    $modal.remove();
                    if (window.notify) notify({ message: 'Connection error', type: 'error' });
                });
        });
    }

    $(document).ready(function () {
        if (!HananAuth.requireAuth()) return;

        var user = HananAuth.getCurrentUser();
        if (user) $('#sbUserName').text(user.charAt(0).toUpperCase() + user.slice(1));

        fetchSkills();

        $('#addNewBtn').on('click', openAddModal);
        $(document).on('click', '#emptyAddBtn', openAddModal);

        $('#refreshBtn').on('click', function () {
            var $btn = $(this);
            $btn.prop('disabled', true).find('i').addClass('fa-spin');
            fetchSkills();
            setTimeout(function () { $btn.prop('disabled', false).find('i').removeClass('fa-spin'); }, 1000);
        });

        $('#skillForm').on('submit', function (e) {
            e.preventDefault();
            saveSkill();
        });

        $('#skillModal').on('click', '[data-close]', closeModal);
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && $('#skillModal').hasClass('show')) closeModal();
        });

        // Color picker sync
        $('#skillColorPicker').on('input', function () { $('#skillColor').val($(this).val()); });
        $('#skillColor').on('input', function () {
            var val = $(this).val();
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) $('#skillColorPicker').val(val);
        });

        // Percent slider
        $('#skillPercent').on('input', function () {
            $('#percentDisplay').text($(this).val());
        });

        // Level radio change
        $('input[name="level"]').on('change', function () {
            setLevel($(this).val());
        });

        // Search
        var searchTimer;
        $('#searchInput').on('input', function () {
            var val = $(this).val();
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () { currentSearch = val; renderSkills(); }, 200);
        });

        // Filter
        $(document).on('click', '.fb[data-filter]', function () {
            $('.fb').removeClass('active');
            $(this).addClass('active');
            currentFilter = $(this).data('filter');
            renderSkills();
        });

        $('#sbToggle').on('click', function () { $('#sidebar').toggleClass('open'); });
        $('#logoutBtn').on('click', function () {
            if (confirm('Logout?')) HananAuth.logout();
        });
    });

})();
