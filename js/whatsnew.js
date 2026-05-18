/* =========================================================
   WHAT'S NEW PAGE - FULL CRUD
   ========================================================= */

(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = HananAuth.getApiUrl();
    var SECRET_KEY = HananAuth.getSecret();

    var allUpdates = [];
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

    function formatDate(dateStr) {
        if (!dateStr) return { day: '--', month: '--' };
        var d = new Date(dateStr);
        return {
            day: d.getDate(),
            month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
        };
    }

    function isThisMonth(dateStr) {
        if (!dateStr) return false;
        var d = new Date(dateStr);
        var now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    function fetchUpdates() {
        $('#updatesList').html(
            '<div class="loading-state">' +
            '<div class="loader-spinner"></div>' +
            '<p>Loading updates...</p></div>'
        );

        fetch(GOOGLE_SCRIPT_URL + '?action=getWhatsNew')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok) {
                    allUpdates = data.updates || [];
                    // Sort by date descending
                    allUpdates.sort(function (a, b) {
                        return new Date(b.date || 0) - new Date(a.date || 0);
                    });
                    updateStats();
                    updateTagFilters();
                    renderUpdates();
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
        $('#updatesList').html(
            '<div class="empty-state">' +
            '<i class="fa-solid fa-triangle-exclamation"></i>' +
            '<h3>Error</h3><p>' + escapeHtml(msg) + '</p>' +
            '<button class="btn-add-first" onclick="location.reload()">Retry</button>' +
            '</div>'
        );
    }

    function updateStats() {
        var thisMonth = allUpdates.filter(function (u) { return isThisMonth(u.date); }).length;
        $('#totalCount').text(allUpdates.length);
        $('#monthCount').text(thisMonth);
    }

    function updateTagFilters() {
        var tags = {};
        allUpdates.forEach(function (u) {
            if (u.tag) tags[u.tag] = (tags[u.tag] || 0) + 1;
        });

        var html = '<button class="fb ' + (currentFilter === 'all' ? 'active' : '') + '" data-filter="all">All</button>';
        Object.keys(tags).forEach(function (tag) {
            html += '<button class="fb ' + (currentFilter === tag ? 'active' : '') + '" data-filter="' + escapeHtml(tag) + '">' + escapeHtml(tag) + '</button>';
        });

        $('#tagFilters').html(html);
    }

    function renderUpdates() {
        var filtered = allUpdates.filter(function (u) {
            if (currentFilter !== 'all' && u.tag !== currentFilter) return false;
            if (currentSearch) {
                var q = currentSearch.toLowerCase();
                var match = (u.title || '').toLowerCase().indexOf(q) > -1 ||
                            (u.description || '').toLowerCase().indexOf(q) > -1;
                if (!match) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            var msg = allUpdates.length === 0
                ? 'Add your first update to share what\'s happening!'
                : 'No updates match your filter.';

            $('#updatesList').html(
                '<div class="empty-state">' +
                '<i class="fa-solid fa-bullhorn"></i>' +
                '<h3>No updates yet</h3>' +
                '<p>' + msg + '</p>' +
                (allUpdates.length === 0 ? '<button class="btn-add-first" id="emptyAddBtn"><i class="fa-solid fa-plus"></i> Add First Update</button>' : '') +
                '</div>'
            );
            return;
        }

        var html = filtered.map(function (u) {
            var d = formatDate(u.date);

            return (
                '<div class="wn-item">' +
                    '<div class="wn-item-date">' +
                        '<span class="wn-day">' + d.day + '</span>' +
                        '<span class="wn-month">' + d.month + '</span>' +
                    '</div>' +
                    '<div class="wn-content">' +
                        (u.tag ? '<span class="wn-tag">' + escapeHtml(u.tag) + '</span>' : '') +
                        '<div class="wn-title">' + escapeHtml(u.title) + '</div>' +
                        '<div class="wn-description">' + escapeHtml(u.description) + '</div>' +
                        (u.link ? '<a href="' + escapeHtml(u.link) + '" target="_blank" style="display:inline-flex;align-items:center;gap:0.4rem;margin-top:0.8rem;color:var(--yellow);font-size:1.2rem;font-weight:600;"><i class="fa-solid fa-arrow-up-right-from-square"></i> View Link</a>' : '') +
                    '</div>' +
                    '<div class="wn-actions">' +
                        '<button class="wn-action-btn edit" data-edit="' + u.id + '" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
                        '<button class="wn-action-btn delete" data-delete="' + u.id + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                '</div>'
            );
        }).join('');

        $('#updatesList').html(html);

        $('.wn-action-btn.edit').on('click', function (e) {
            e.stopPropagation();
            openEditModal($(this).data('edit'));
        });
        $('.wn-action-btn.delete').on('click', function (e) {
            e.stopPropagation();
            confirmDelete($(this).data('delete'));
        });
    }

    function openAddModal() {
        editingId = null;
        $('#modalTitle').text('Add Update');
        $('#updateForm')[0].reset();
        $('#updateId').val('');
        // Default date today
        $('#updateDate').val(new Date().toISOString().split('T')[0]);
        $('#updateTag').val('NEW');
        $('#updateModal').addClass('show');
        setTimeout(function () { $('#updateTitle').focus(); }, 300);
    }

    function openEditModal(id) {
        var u = allUpdates.find(function (x) { return x.id === id; });
        if (!u) return;

        editingId = id;
        $('#modalTitle').text('Edit Update');
        $('#updateId').val(u.id);
        $('#updateTitle').val(u.title || '');
        $('#updateTag').val(u.tag || '');
        $('#updateDescription').val(u.description || '');
        $('#updateLink').val(u.link || '');

        // Format date for input
        if (u.date) {
            var d = new Date(u.date);
            $('#updateDate').val(d.toISOString().split('T')[0]);
        }

        $('#updateModal').addClass('show');
    }

    function closeModal() {
        $('#updateModal').removeClass('show');
        editingId = null;
    }

    function saveUpdate() {
        var title = $('#updateTitle').val().trim();
        var tag = $('#updateTag').val().trim().toUpperCase();
        var description = $('#updateDescription').val().trim();
        var date = $('#updateDate').val();
        var link = $('#updateLink').val().trim();

        if (!title) { showFormError('Title required'); return; }
        if (!description) { showFormError('Description required'); return; }
        if (!date) { showFormError('Date required'); return; }

        var $btn = $('#saveBtn');
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> <span>Saving...</span>');

        var formData = new FormData();
        formData.append('action', 'saveWhatsNew');
        formData.append('secret', SECRET_KEY);
        if (editingId) formData.append('id', editingId);
        formData.append('title', title);
        formData.append('tag', tag);
        formData.append('description', description);
        formData.append('date', date);
        formData.append('link', link);

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                $btn.prop('disabled', false).html('<i class="fa-solid fa-check"></i> <span>Save Update</span>');

                if (res && res.ok) {
                    if (window.notify) {
                        notify({
                            title: editingId ? 'Update Edited' : 'Update Added',
                            message: title,
                            type: 'success',
                            persist: true
                        });
                    }
                    closeModal();
                    fetchUpdates();
                } else {
                    showFormError(res.error || 'Failed to save');
                }
            })
            .catch(function () {
                $btn.prop('disabled', false).html('<i class="fa-solid fa-check"></i> <span>Save Update</span>');
                showFormError('Connection error');
            });
    }

    function confirmDelete(id) {
        var u = allUpdates.find(function (x) { return x.id === id; });
        if (!u) return;

        var $modal = $(
            '<div class="modal show">' +
                '<div class="modal-backdrop" data-confirm-close></div>' +
                '<div class="modal-card confirm-modal" style="max-width: 44rem;">' +
                    '<div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
                    '<h2>Delete Update?</h2>' +
                    '<p>Delete <strong>"' + escapeHtml(u.title) + '"</strong>? This cannot be undone.</p>' +
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
            formData.append('action', 'deleteWhatsNew');
            formData.append('secret', SECRET_KEY);
            formData.append('id', id);

            fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    $modal.remove();
                    if (res && res.ok) {
                        allUpdates = allUpdates.filter(function (x) { return x.id !== id; });
                        updateStats();
                        updateTagFilters();
                        renderUpdates();
                        if (window.notify) notify({ title: 'Deleted', message: 'Update removed.', type: 'success' });
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

        fetchUpdates();

        $('#addNewBtn').on('click', openAddModal);
        $(document).on('click', '#emptyAddBtn', openAddModal);

        $('#refreshBtn').on('click', function () {
            var $btn = $(this);
            $btn.prop('disabled', true).find('i').addClass('fa-spin');
            fetchUpdates();
            setTimeout(function () { $btn.prop('disabled', false).find('i').removeClass('fa-spin'); }, 1000);
        });

        $('#updateForm').on('submit', function (e) {
            e.preventDefault();
            saveUpdate();
        });

        $('#updateModal').on('click', '[data-close]', closeModal);
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && $('#updateModal').hasClass('show')) closeModal();
        });

        var searchTimer;
        $('#searchInput').on('input', function () {
            var val = $(this).val();
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () { currentSearch = val; renderUpdates(); }, 200);
        });

        $(document).on('click', '.fb[data-filter]', function () {
            $('.fb').removeClass('active');
            $(this).addClass('active');
            currentFilter = $(this).data('filter');
            renderUpdates();
        });

        $('#sbToggle').on('click', function () { $('#sidebar').toggleClass('open'); });
        $('#logoutBtn').on('click', function () {
            if (confirm('Logout?')) HananAuth.logout();
        });
    });

})();
