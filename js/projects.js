/* =========================================================
   PROJECTS PAGE - FULL CRUD
   ========================================================= */

(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = HananAuth.getApiUrl();
    var SECRET_KEY = HananAuth.getSecret();

    var allProjects = [];
    var currentFilter = 'all';
    var currentSearch = '';
    var editingId = null;

    // ===== HELPERS =====

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function showToast(message, type) {
        type = type || 'info';
        $('.toast').remove();
        var icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-info-circle');
        var $toast = $('<div class="toast ' + type + '"><i class="fa-solid ' + icon + '"></i> ' + escapeHtml(message) + '</div>');
        $('body').append($toast);
        setTimeout(function () { $toast.addClass('show'); }, 50);
        setTimeout(function () {
            $toast.removeClass('show');
            setTimeout(function () { $toast.remove(); }, 400);
        }, 3000);
    }

    function showFormError(msg) {
        $('#formError').text(msg).addClass('show');
        setTimeout(function () { $('#formError').removeClass('show'); }, 5000);
    }

    // ===== FETCH PROJECTS =====

    function fetchProjects() {
        $('#projectsGrid').html(
            '<div class="loading-state">' +
            '<div class="loader-spinner"></div>' +
            '<p>Loading projects from Google Sheets...</p>' +
            '</div>'
        );

        fetch(GOOGLE_SCRIPT_URL + '?action=getProjects')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok) {
                    allProjects = data.projects || [];
                    updateStats();
                    updateCategoryFilters();
                    renderProjects();
                } else {
                    showError(data.error || 'Failed to load');
                }
            })
            .catch(function (err) {
                console.error('Fetch error:', err);
                showError('Connection error. Check your internet.');
            });
    }

    function showError(msg) {
        $('#projectsGrid').html(
            '<div class="empty-state">' +
            '<i class="fa-solid fa-triangle-exclamation"></i>' +
            '<h3>Error</h3><p>' + escapeHtml(msg) + '</p>' +
            '<button class="btn-save" onclick="location.reload()">Retry</button>' +
            '</div>'
        );
    }

    function updateStats() {
        var categories = {};
        allProjects.forEach(function (p) {
            if (p.category) categories[p.category] = true;
        });
        $('#totalCount').text(allProjects.length);
        $('#categoryCount').text(Object.keys(categories).length);
    }

    function updateCategoryFilters() {
        var categories = {};
        allProjects.forEach(function (p) {
            if (p.category) categories[p.category] = (categories[p.category] || 0) + 1;
        });

        var html = '<button class="fb ' + (currentFilter === 'all' ? 'active' : '') + '" data-filter="all">All</button>';
        Object.keys(categories).forEach(function (cat) {
            html += '<button class="fb ' + (currentFilter === cat ? 'active' : '') + '" data-filter="' + escapeHtml(cat) + '">' + escapeHtml(cat) + '</button>';
        });

        $('#categoryFilters').html(html);
    }

    function renderProjects() {
        var filtered = allProjects.filter(function (p) {
            if (currentFilter !== 'all' && p.category !== currentFilter) return false;
            if (currentSearch) {
                var s = currentSearch.toLowerCase();
                var match = (p.title || '').toLowerCase().indexOf(s) > -1 ||
                            (p.description || '').toLowerCase().indexOf(s) > -1 ||
                            (p.tech || '').toLowerCase().indexOf(s) > -1;
                if (!match) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            var msg = allProjects.length === 0
                ? 'Add your first project to get started!'
                : 'No projects match your filter.';

            $('#projectsGrid').html(
                '<div class="empty-state">' +
                '<i class="fa-solid fa-folder-open"></i>' +
                '<h3>No projects yet</h3>' +
                '<p>' + msg + '</p>' +
                (allProjects.length === 0 ? '<button class="btn-save" id="emptyAddBtn"><i class="fa-solid fa-plus"></i> Add First Project</button>' : '') +
                '</div>'
            );
            return;
        }

        var html = filtered.map(function (p) {
            var techList = (p.tech || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
            var techHtml = techList.slice(0, 4).map(function (t) {
                return '<span class="tech-tag">' + escapeHtml(t) + '</span>';
            }).join('');

            return (
                '<div class="project-card" style="--proj-color: ' + escapeHtml(p.color || '#f9ca24') + ';">' +
                    '<div class="project-thumb">' +
                        (p.imageUrl
                            ? '<img src="' + escapeHtml(p.imageUrl) + '" alt="' + escapeHtml(p.title) + '" onerror="this.style.display=\'none\';this.parentElement.innerHTML+=\'<i class=&quot;fa-solid fa-image placeholder-icon&quot;></i>\';" />'
                            : '<i class="fa-solid fa-folder-open placeholder-icon"></i>') +
                        (p.category ? '<span class="project-category">' + escapeHtml(p.category) + '</span>' : '') +
                        '<div class="project-actions-overlay">' +
                            '<button class="proj-action-btn edit" data-edit="' + p.id + '" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
                            '<button class="proj-action-btn delete" data-delete="' + p.id + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="project-info">' +
                        '<h3>' + escapeHtml(p.title) + '</h3>' +
                        (p.description ? '<p>' + escapeHtml(p.description) + '</p>' : '') +
                        (techHtml ? '<div class="project-tech">' + techHtml + '</div>' : '') +
                        (p.liveUrl ? '<a href="' + escapeHtml(p.liveUrl) + '" target="_blank" rel="noopener" class="project-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> View Live</a>' : '') +
                    '</div>' +
                '</div>'
            );
        }).join('');

        $('#projectsGrid').html(html);

        // Bind actions
        $('.proj-action-btn.edit').on('click', function (e) {
            e.stopPropagation();
            openEditModal($(this).data('edit'));
        });
        $('.proj-action-btn.delete').on('click', function (e) {
            e.stopPropagation();
            confirmDelete($(this).data('delete'));
        });
    }

    // ===== ADD/EDIT MODAL =====

    function openAddModal() {
        editingId = null;
        $('#modalTitle').text('Add New Project');
        $('#projectForm')[0].reset();
        $('#projColor').val('#f9ca24');
        $('#projColorPicker').val('#f9ca24');
        $('#projectId').val('');
        $('#projectModal').addClass('show');
        setTimeout(function () { $('#projTitle').focus(); }, 300);
    }

    function openEditModal(id) {
        var project = allProjects.find(function (p) { return p.id === id; });
        if (!project) return;

        editingId = id;
        $('#modalTitle').text('Edit Project');
        $('#projectId').val(project.id);
        $('#projTitle').val(project.title || '');
        $('#projCategory').val(project.category || '');
        $('#projDescription').val(project.description || '');
        $('#projImage').val(project.imageUrl || '');
        $('#projLiveUrl').val(project.liveUrl || '');
        $('#projTech').val(project.tech || '');
        $('#projColor').val(project.color || '#f9ca24');
        $('#projColorPicker').val(project.color || '#f9ca24');
        $('#projectModal').addClass('show');
    }

    function closeModal() {
        $('#projectModal').removeClass('show');
        editingId = null;
    }

    function saveProject() {
        var title = $('#projTitle').val().trim();
        var category = $('#projCategory').val().trim();
        var description = $('#projDescription').val().trim();
        var imageUrl = $('#projImage').val().trim();
        var liveUrl = $('#projLiveUrl').val().trim();
        var tech = $('#projTech').val().trim();
        var color = $('#projColor').val().trim() || '#f9ca24';

        if (!title) {
            showFormError('Title is required');
            return;
        }
        if (!category) {
            showFormError('Category is required');
            return;
        }

        var $btn = $('#saveBtn');
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> <span>Saving...</span>');

        var formData = new FormData();
        formData.append('action', 'saveProject');
        formData.append('secret', SECRET_KEY);
        if (editingId) formData.append('id', editingId);
        formData.append('title', title);
        formData.append('category', category);
        formData.append('description', description);
        formData.append('imageUrl', imageUrl);
        formData.append('liveUrl', liveUrl);
        formData.append('tech', tech);
        formData.append('color', color);

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                $btn.prop('disabled', false).html('<i class="fa-solid fa-check"></i> <span>Save Project</span>');

                if (res && res.ok) {
                    notify({
                        title: editingId ? 'Project Updated' : 'Project Added',
                        message: editingId ? 'Project changes saved successfully.' : 'New project added to your portfolio.',
                        type: 'success',
                        persist: true
                    });
                    closeModal();
                    fetchProjects();
                } else {
                    showFormError(res.error || 'Failed to save');
                }
            })
            .catch(function (err) {
                console.error('Save error:', err);
                $btn.prop('disabled', false).html('<i class="fa-solid fa-check"></i> <span>Save Project</span>');
                showFormError('Connection error');
            });
    }

    // ===== DELETE =====

    function confirmDelete(id) {
        var project = allProjects.find(function (p) { return p.id === id; });
        if (!project) return;

        var $modal = $(
            '<div class="modal show">' +
                '<div class="modal-backdrop" data-confirm-close></div>' +
                '<div class="modal-card confirm-modal" style="max-width: 44rem;">' +
                    '<div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
                    '<h2>Delete Project?</h2>' +
                    '<p>Are you sure you want to delete <strong>"' + escapeHtml(project.title) + '"</strong>? This cannot be undone.</p>' +
                    '<div class="confirm-actions">' +
                        '<button class="btn-cancel" data-confirm-close>Cancel</button>' +
                        '<button class="btn-danger" id="confirmDeleteBtn"><i class="fa-solid fa-trash"></i> Delete</button>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );

        $('body').append($modal);

        $modal.on('click', '[data-confirm-close]', function () {
            $modal.remove();
        });

        $modal.find('#confirmDeleteBtn').on('click', function () {
            var $btn = $(this);
            $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Deleting...');

            var formData = new FormData();
            formData.append('action', 'deleteProject');
            formData.append('secret', SECRET_KEY);
            formData.append('id', id);

            fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    $modal.remove();
                    if (res && res.ok) {
                        allProjects = allProjects.filter(function (p) { return p.id !== id; });
                        updateStats();
                        updateCategoryFilters();
                        renderProjects();
                        notify({
                            title: 'Project Deleted',
                            message: 'Project removed from your portfolio.',
                            type: 'success',
                            persist: true
                        });
                    } else {
                        notify({
                            title: 'Delete Failed',
                            message: res.error || 'Could not delete project. Please try again.',
                            type: 'error'
                        });
                    }
                })
                .catch(function (err) {
                    $modal.remove();
                    notify({
                        title: 'Connection Error',
                        message: 'Could not connect to server. Check your internet.',
                        type: 'error'
                    });
                });
        });
    }

    // ===== INIT =====
    $(document).ready(function () {
        if (!HananAuth.requireAuth()) return;

        var user = HananAuth.getCurrentUser();
        if (user) $('#sbUserName').text(user.charAt(0).toUpperCase() + user.slice(1));

        fetchProjects();

        // Add button
        $('#addNewBtn').on('click', openAddModal);
        $(document).on('click', '#emptyAddBtn', openAddModal);

        // Refresh
        $('#refreshBtn').on('click', function () {
            var $btn = $(this);
            $btn.prop('disabled', true).find('i').addClass('fa-spin');
            fetchProjects();
            setTimeout(function () {
                $btn.prop('disabled', false).find('i').removeClass('fa-spin');
            }, 1000);
        });

        // Form submit
        $('#projectForm').on('submit', function (e) {
            e.preventDefault();
            saveProject();
        });

        // Modal close
        $('#projectModal').on('click', '[data-close]', closeModal);
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape') closeModal();
        });

        // Color picker sync
        $('#projColorPicker').on('input', function () {
            $('#projColor').val($(this).val());
        });
        $('#projColor').on('input', function () {
            var val = $(this).val();
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                $('#projColorPicker').val(val);
            }
        });

        // Search
        var searchTimer;
        $('#searchInput').on('input', function () {
            var val = $(this).val();
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () {
                currentSearch = val;
                renderProjects();
            }, 200);
        });

        // Category filter
        $(document).on('click', '.fb[data-filter]', function () {
            $('.fb').removeClass('active');
            $(this).addClass('active');
            currentFilter = $(this).data('filter');
            renderProjects();
        });

        // Sidebar
        $('#sbToggle').on('click', function () {
            $('#sidebar').toggleClass('open');
        });

        // Logout
        $('#logoutBtn').on('click', function () {
            if (confirm('Logout?')) HananAuth.logout();
        });
    });

})();
