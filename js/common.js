/* HANAN DASHBOARD - COMMON UTILITIES */

window.escapeHtml = function (str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

window.timeAgo = function (dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    var diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

window.getInitials = function (name) {
    if (!name) return '?';
    var parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

window.notify = function (opts) {
    var container = document.getElementById('notifyContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifyContainer';
        container.className = 'notify-container';
        document.body.appendChild(container);
    }
    var msg = typeof opts === 'string' ? opts : (opts.message || '');
    var type = opts.type || 'success';
    var item = document.createElement('div');
    item.className = 'notify-item ' + type;
    var icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'circle-xmark' : 'circle-exclamation');
    item.innerHTML = '<i class="fa-solid fa-' + icon + '" style="color: var(--' + (type === 'success' ? 'success' : type === 'error' ? 'error' : 'warning') + ');"></i><span>' + escapeHtml(msg) + '</span>';
    container.appendChild(item);
    setTimeout(function () {
        item.style.opacity = '0';
        item.style.transform = 'translateX(50px)';
        setTimeout(function () { item.remove(); }, 300);
    }, 3000);
};

/* Set sidebar username */
$(function () {
    var user = HananAuth.getCurrentUser();
    if (user) $('#sbUserName').text(user.charAt(0).toUpperCase() + user.slice(1));
});

/* Generic CRUD Helper for cards-with-modal pages */
window.CRUD = {
    /**
     * Initialize a CRUD page
     * config: {
     *   endpoint: 'getProjects',           // GET action
     *   saveAction: 'saveProject',         // POST save action
     *   deleteAction: 'deleteProject',     // POST delete action
     *   dataKey: 'projects',               // key in response
     *   renderCard: function(item) {...},  // returns HTML string
     *   populateForm: function(item) {...},// fill modal form with item data
     *   getFormData: function() {...},     // returns object to send
     *   resetForm: function() {...},       // clear form
     *   filterFn: function(item, f) {...}, // optional: filter logic
     *   sortFn: function(items) {...},     // optional: sort
     *   emptyIcon: 'fa-folder-open',
     *   emptyText: 'No projects yet'
     * }
     */
    init: function (config) {
        var self = this;
        self.config = config;
        self.items = [];
        self.filter = 'all';
        if (!HananAuth.requireAuth()) return;

        self.loadItems();

        $('#addBtn').on('click', function () { self.openModal(null); });
        $('#refreshBtn').on('click', function () { self.loadItems(); });
        $('#modalClose, #cancelBtn').on('click', function () { self.closeModal(); });
        $('#itemForm').on('submit', function (e) { self.save(e); });

        $('.filter-bar').on('click', '.filter-btn', function () {
            $('.filter-bar .filter-btn').removeClass('active');
            $(this).addClass('active');
            self.filter = $(this).data('filter') || 'all';
            self.render();
        });

        $('#grid').on('click', '.cc-btn.btn-edit', function () {
            var id = $(this).data('id');
            var item = self.items.find(function (i) { return i.id === id; });
            if (item) self.openModal(item);
        });
        $('#grid').on('click', '.cc-btn.btn-delete', function () {
            self.deleteItem($(this).data('id'));
        });
        $('#grid').on('click', '.cc-btn.btn-hide', function () {
            var id = $(this).data('id');
            var item = self.items.find(function (i) { return i.id === id; });
            if (item) self.toggleVisibility(item);
        });

        /* Color sync */
        $('#color').on('input', function () { $('#colorHex').val($(this).val()); });
        $('#colorHex').on('input', function () {
            if (/^#[0-9A-F]{6}$/i.test($(this).val())) $('#color').val($(this).val());
        });

        /* Visibility toggle */
        $('#visibleToggle').on('click', function () {
            $(this).toggleClass('on');
            $('#visible').val($(this).hasClass('on') ? 'yes' : 'no');
        });

        /* Featured toggle */
        $('#featuredToggle').on('click', function () {
            $(this).toggleClass('on');
            $('#featured').val($(this).hasClass('on') ? 'yes' : 'no');
        });

        /* Percentage range live update */
        $('#percent').on('input', function () { $('#percentValue').text($(this).val() + '%'); });
    },

    loadItems: function () {
        var self = this;
        $('#grid').html('<div class="loading-state"><div class="loader-spinner"></div><p>Loading...</p></div>');
        fetch(HananAuth.getApiUrl() + '?action=' + self.config.endpoint)
            .then(function (r) { return r.json(); })
            .then(function (res) {
                self.items = (res && res[self.config.dataKey]) || [];
                self.render();
            })
            .catch(function (err) {
                $('#grid').html('<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Connection Error</h3><p>Could not load data</p></div>');
            });
    },

    render: function () {
        var self = this;
        var filtered = self.items;
        if (self.config.filterFn) {
            filtered = self.items.filter(function (i) { return self.config.filterFn(i, self.filter); });
        }

        /* Update filter counts */
        if (typeof self.config.updateCounts === 'function') {
            self.config.updateCounts(self.items);
        }

        if (filtered.length === 0) {
            $('#grid').html(
                '<div class="empty-state">' +
                '<i class="fa-solid ' + (self.config.emptyIcon || 'fa-folder-open') + '"></i>' +
                '<h3>' + (self.config.emptyText || 'Nothing here yet') + '</h3>' +
                '<p>Click "Add New" to create your first item</p>' +
                '<button class="btn-add-first" onclick="document.getElementById(\'addBtn\').click()"><i class="fa-solid fa-plus"></i> Add First Item</button>' +
                '</div>'
            );
            return;
        }

        if (self.config.sortFn) filtered = self.config.sortFn(filtered);

        var html = filtered.map(self.config.renderCard).join('');
        $('#grid').html(html);
    },

    openModal: function (item) {
        var self = this;
        if (item) {
            $('#modalTitle').text('Edit Item');
            $('#saveBtnText').text('Update');
            self.config.populateForm(item);
        } else {
            $('#modalTitle').text('Add New');
            $('#saveBtnText').text('Save');
            $('#itemForm')[0].reset();
            $('#itemId').val('');
            if (self.config.resetForm) self.config.resetForm();
        }
        $('#modalOverlay').addClass('open');
    },

    closeModal: function () { $('#modalOverlay').removeClass('open'); },

    save: function (e) {
        e.preventDefault();
        var self = this;
        var $btn = $('button[type="submit"]', '#itemForm');
        var origText = $btn.html();
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Saving...');

        var fd = new FormData();
        fd.append('action', self.config.saveAction);
        fd.append('secret', HananAuth.getSecret());

        var data = self.config.getFormData();
        Object.keys(data).forEach(function (k) {
            if (data[k] !== null && data[k] !== undefined) fd.append(k, data[k]);
        });

        fetch(HananAuth.getApiUrl(), { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    self.closeModal();
                    try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
                    notify({ message: 'Saved successfully!', type: 'success' });
                    self.loadItems();
                } else {
                    notify({ message: 'Error: ' + (res.error || 'Failed'), type: 'error' });
                    $btn.prop('disabled', false).html(origText);
                }
            })
            .catch(function () {
                notify({ message: 'Connection error', type: 'error' });
                $btn.prop('disabled', false).html(origText);
            });
    },

    deleteItem: function (id) {
        var self = this;
        if (!confirm('Delete this item? This cannot be undone.')) return;
        var fd = new FormData();
        fd.append('action', self.config.deleteAction);
        fd.append('secret', HananAuth.getSecret());
        fd.append('id', id);
        fetch(HananAuth.getApiUrl(), { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
                    notify({ message: 'Deleted!', type: 'success' });
                    self.loadItems();
                } else {
                    notify({ message: 'Error: ' + (res.error || 'Failed'), type: 'error' });
                }
            })
            .catch(function () { notify({ message: 'Connection error', type: 'error' }); });
    },

    toggleVisibility: function (item) {
        var self = this;
        item.visible = item.visible === 'no' ? 'yes' : 'no';
        var fd = new FormData();
        fd.append('action', self.config.saveAction);
        fd.append('secret', HananAuth.getSecret());
        Object.keys(item).forEach(function (k) {
            if (item[k] !== null && item[k] !== undefined) fd.append(k, item[k]);
        });
        fetch(HananAuth.getApiUrl(), { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
                    notify({ message: item.visible === 'yes' ? 'Shown' : 'Hidden', type: 'success' });
                    self.loadItems();
                }
            });
    }
};
