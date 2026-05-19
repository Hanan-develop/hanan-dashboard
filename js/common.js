/* =========================================================
   HANAN DASHBOARD - COMMON UTILITIES v2
   Now includes: Search, Filter, Export, Stats helpers
   ========================================================= */

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
    var color = type === 'success' ? 'success' : type === 'error' ? 'error' : 'warning';
    item.innerHTML = '<i class="fa-solid fa-' + icon + '" style="color: var(--' + color + ');"></i><span>' + escapeHtml(msg) + '</span>';
    container.appendChild(item);
    setTimeout(function () {
        item.style.opacity = '0';
        item.style.transform = 'translateX(50px)';
        setTimeout(function () { item.remove(); }, 300);
    }, 3000);
};

/* Export to JSON file */
window.exportToJSON = function (data, filename) {
    try {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename || 'export-' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        notify({ message: 'Exported as ' + a.download, type: 'success' });
    } catch (e) {
        notify({ message: 'Export failed', type: 'error' });
    }
};

/* Set sidebar username */
$(function () {
    var user = HananAuth.getCurrentUser();
    if (user) $('#sbUserName').text(user.charAt(0).toUpperCase() + user.slice(1));
});

/* =========================================================
   GENERIC CRUD HELPER v2 — with Search, Filter, Export
   ========================================================= */
window.CRUD = {
    init: function (config) {
        var self = this;
        self.config = config;
        self.items = [];
        self.filter = 'all';
        self.searchQuery = '';
        if (!HananAuth.requireAuth()) return;

        self.loadItems();

        $('#addBtn').on('click', function () { self.openModal(null); });
        $('#refreshBtn').on('click', function () {
            try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
            self.loadItems();
        });
        $('#exportBtn').on('click', function () {
            exportToJSON(self.items, config.dataKey + '-export.json');
        });
        $('#modalClose, #cancelBtn').on('click', function () { self.closeModal(); });
        $('#itemForm').on('submit', function (e) { self.save(e); });

        $('.filter-bar').on('click', '.filter-btn', function () {
            $('.filter-bar .filter-btn').removeClass('active');
            $(this).addClass('active');
            self.filter = $(this).data('filter') || 'all';
            self.render();
        });

        /* SEARCH input */
        $('#searchInput').on('input', function () {
            self.searchQuery = $(this).val().toLowerCase().trim();
            self.render();
        });

        /* Modal close on outside click */
        $('#modalOverlay').on('click', function (e) {
            if (e.target === this) self.closeModal();
        });

        /* Card actions delegation */
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

        /* Color picker sync */
        $('#color').on('input', function () { $('#colorHex').val($(this).val()); });
        $('#colorHex').on('input', function () {
            if (/^#[0-9A-F]{6}$/i.test($(this).val())) $('#color').val($(this).val());
        });

        /* Visibility/Featured toggles */
        $('#visibleToggle').on('click', function () {
            $(this).toggleClass('on');
            $('#visible').val($(this).hasClass('on') ? 'yes' : 'no');
        });
        $('#featuredToggle').on('click', function () {
            $(this).toggleClass('on');
            $('#featured').val($(this).hasClass('on') ? 'yes' : 'no');
        });

        /* Percent range live update */
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
            .catch(function () {
                $('#grid').html('<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Connection Error</h3><p>Could not load data</p></div>');
            });
    },

    /* Search across all fields */
    matchesSearch: function (item) {
        if (!this.searchQuery) return true;
        var q = this.searchQuery;
        var searchable = JSON.stringify(item).toLowerCase();
        return searchable.indexOf(q) > -1;
    },

    render: function () {
        var self = this;
        var filtered = self.items;

        if (self.config.filterFn) {
            filtered = filtered.filter(function (i) { return self.config.filterFn(i, self.filter); });
        }

        /* Apply search filter */
        filtered = filtered.filter(function (i) { return self.matchesSearch(i); });

        if (typeof self.config.updateCounts === 'function') {
            self.config.updateCounts(self.items);
        }

        if (filtered.length === 0) {
            var msg = self.searchQuery ?
                '<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><h3>No results found</h3><p>Try a different search term</p></div>' :
                '<div class="empty-state">' +
                '<i class="fa-solid ' + (self.config.emptyIcon || 'fa-folder-open') + '"></i>' +
                '<h3>' + (self.config.emptyText || 'Nothing here yet') + '</h3>' +
                '<p>Click "Add New" to create your first item</p>' +
                '<button class="btn-add-first" onclick="document.getElementById(\'addBtn\').click()"><i class="fa-solid fa-plus"></i> Add First Item</button>' +
                '</div>';
            $('#grid').html(msg);
            return;
        }

        if (self.config.sortFn) filtered = self.config.sortFn(filtered);

        var html = filtered.map(self.config.renderCard).join('');
        $('#grid').html(html);

        /* Show result count if searching */
        if (self.searchQuery) {
            $('#searchResultCount').text(filtered.length + ' result' + (filtered.length !== 1 ? 's' : '')).show();
        } else {
            $('#searchResultCount').hide();
        }
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
                    notify({ message: res.action === 'updated' ? 'Updated successfully!' : 'Saved successfully!', type: 'success' });
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
