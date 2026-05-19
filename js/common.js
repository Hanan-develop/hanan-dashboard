/* =========================================================
   HANAN DASHBOARD - COMMON UTILITIES v3 (Phase 2)
   Adds: Bulk Delete, PDF/DOCX Export, Drag-drop, Image Upload
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

/* =========================================================
   EXPORT — PDF and DOCX
   ========================================================= */
window.exportToPDF = function (items, sectionName, columns) {
    try {
        var win = window.open('', '_blank');
        if (!win) {
            notify({ message: 'Allow popups for export', type: 'error' });
            return;
        }

        var rows = items.map(function (item, i) {
            var cells = columns.map(function (col) {
                var val = item[col.key];
                if (col.format === 'date' && val) val = new Date(val).toLocaleDateString();
                if (col.format === 'bool') val = val === 'yes' || val === true ? 'Yes' : 'No';
                if (col.format === 'stars') {
                    var n = parseInt(val) || 0;
                    val = '★'.repeat(n) + '☆'.repeat(5 - n);
                }
                if (val === null || val === undefined) val = '';
                return '<td>' + escapeHtml(String(val).substring(0, 200)) + '</td>';
            }).join('');
            return '<tr><td>' + (i + 1) + '</td>' + cells + '</tr>';
        }).join('');

        var headers = '<th>#</th>' + columns.map(function (c) { return '<th>' + escapeHtml(c.label) + '</th>'; }).join('');

        var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + sectionName + ' Export</title>' +
            '<style>' +
            '* { margin: 0; padding: 0; box-sizing: border-box; }' +
            'body { font-family: Arial, sans-serif; padding: 40px; color: #111; }' +
            '.header { border-bottom: 3px solid #f9ca24; padding-bottom: 20px; margin-bottom: 30px; }' +
            '.header h1 { color: #111; font-size: 24px; margin-bottom: 5px; }' +
            '.header p { color: #666; font-size: 12px; }' +
            '.meta { background: #fef9e7; border-left: 4px solid #f9ca24; padding: 12px 16px; margin-bottom: 20px; font-size: 11px; color: #555; }' +
            'table { width: 100%; border-collapse: collapse; font-size: 11px; }' +
            'th { background: #f9ca24; color: #111; padding: 10px 8px; text-align: left; font-weight: 700; border: 1px solid #d4a91f; }' +
            'td { padding: 8px; border: 1px solid #e0e0e0; vertical-align: top; max-width: 200px; word-wrap: break-word; }' +
            'tr:nth-child(even) td { background: #fafafa; }' +
            '.footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #999; text-align: center; }' +
            '@media print { body { padding: 20px; } @page { size: A4 landscape; margin: 1cm; } }' +
            '</style></head><body>' +
            '<div class="header"><h1>' + sectionName + ' Export</h1><p>Abdul Hanan Portfolio Dashboard</p></div>' +
            '<div class="meta">Exported: ' + new Date().toLocaleString() + ' · Total Items: ' + items.length + '</div>' +
            '<table><thead><tr>' + headers + '</tr></thead><tbody>' + rows + '</tbody></table>' +
            '<div class="footer">Generated by Hanan Dashboard · hanan-develop.github.io/hanan-dashboard</div>' +
            '<script>window.onload=function(){setTimeout(function(){window.print();},500);}<\/script>' +
            '</body></html>';

        win.document.write(html);
        win.document.close();
        notify({ message: 'PDF dialog opened — click Save as PDF', type: 'success' });
    } catch (e) {
        notify({ message: 'PDF export failed', type: 'error' });
        console.error(e);
    }
};

window.exportToDOCX = function (items, sectionName, columns) {
    try {
        /* DOCX is actually HTML with .doc extension — Word opens it perfectly */
        var rows = items.map(function (item, i) {
            var cells = columns.map(function (col) {
                var val = item[col.key];
                if (col.format === 'date' && val) val = new Date(val).toLocaleDateString();
                if (col.format === 'bool') val = val === 'yes' || val === true ? 'Yes' : 'No';
                if (col.format === 'stars') {
                    var n = parseInt(val) || 0;
                    val = '★'.repeat(n) + '☆'.repeat(5 - n);
                }
                if (val === null || val === undefined) val = '';
                return '<td>' + escapeHtml(String(val)) + '</td>';
            }).join('');
            return '<tr><td>' + (i + 1) + '</td>' + cells + '</tr>';
        }).join('');

        var headers = '<th>#</th>' + columns.map(function (c) { return '<th>' + escapeHtml(c.label) + '</th>'; }).join('');

        var html =
            '<!DOCTYPE html>' +
            '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
            '<head><meta charset="UTF-8"><title>' + sectionName + '</title>' +
            '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->' +
            '<style>' +
            'body { font-family: Calibri, Arial, sans-serif; padding: 20px; }' +
            'h1 { color: #333; border-bottom: 3px solid #f9ca24; padding-bottom: 8px; }' +
            '.meta { background: #fef9e7; padding: 10px; margin: 15px 0; border-left: 4px solid #f9ca24; font-size: 10pt; }' +
            'table { width: 100%; border-collapse: collapse; margin-top: 15px; }' +
            'th { background: #f9ca24; padding: 10px; border: 1px solid #d4a91f; text-align: left; }' +
            'td { padding: 8px; border: 1px solid #ddd; vertical-align: top; }' +
            'tr:nth-child(even) td { background: #fafafa; }' +
            '</style></head><body>' +
            '<h1>' + sectionName + ' — Hanan Portfolio</h1>' +
            '<div class="meta">Exported: ' + new Date().toLocaleString() + ' · Total: ' + items.length + ' items</div>' +
            '<table><thead><tr>' + headers + '</tr></thead><tbody>' + rows + '</tbody></table>' +
            '<p style="margin-top: 30px; font-size: 9pt; color: #999;">Generated by Hanan Dashboard</p>' +
            '</body></html>';

        var blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = sectionName.toLowerCase().replace(/\s+/g, '-') + '-' + new Date().toISOString().split('T')[0] + '.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        notify({ message: 'Word document downloaded!', type: 'success' });
    } catch (e) {
        notify({ message: 'DOCX export failed', type: 'error' });
        console.error(e);
    }
};

/* =========================================================
   IMAGE UPLOAD HELPER (Base64)
   ========================================================= */
window.handleImageUpload = function (file, callback) {
    if (!file) return callback(null);
    if (file.size > 2 * 1024 * 1024) {
        notify({ message: 'Image too large (max 2MB)', type: 'error' });
        return callback(null);
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        /* Compress before storing */
        var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            var maxW = 800;
            var ratio = maxW / img.width;
            canvas.width = maxW;
            canvas.height = img.height * ratio;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            var compressed = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressed);
        };
        img.src = e.target.result;
    };
    reader.onerror = function () {
        notify({ message: 'Image read failed', type: 'error' });
        callback(null);
    };
    reader.readAsDataURL(file);
};

/* Set sidebar username */
$(function () {
    var user = HananAuth.getCurrentUser();
    if (user) $('#sbUserName').text(user.charAt(0).toUpperCase() + user.slice(1));
});

/* =========================================================
   ENHANCED CRUD HELPER v3 — Phase 2 Features
   ========================================================= */
window.CRUD = {
    init: function (config) {
        var self = this;
        self.config = config;
        self.items = [];
        self.filter = 'all';
        self.searchQuery = '';
        self.selectedIds = {};
        self.bulkMode = false;
        if (!HananAuth.requireAuth()) return;

        self.loadItems();

        $('#addBtn').on('click', function () { self.openModal(null); });
        $('#refreshBtn').on('click', function () {
            try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
            self.loadItems();
        });

        /* Bulk delete toggle */
        $('#bulkModeBtn').on('click', function () {
            self.bulkMode = !self.bulkMode;
            self.selectedIds = {};
            $(this).toggleClass('active', self.bulkMode);
            $('#bulkActionBar').toggle(self.bulkMode);
            self.render();
        });

        $('#bulkSelectAll').on('click', function () {
            var filtered = self.getFiltered();
            var allSelected = filtered.every(function (i) { return self.selectedIds[i.id]; });
            if (allSelected) self.selectedIds = {};
            else filtered.forEach(function (i) { self.selectedIds[i.id] = true; });
            self.render();
            self.updateBulkBar();
        });

        $('#bulkDeleteBtn').on('click', function () { self.bulkDelete(); });
        $('#bulkCancelBtn').on('click', function () {
            self.bulkMode = false;
            self.selectedIds = {};
            $('#bulkModeBtn').removeClass('active');
            $('#bulkActionBar').hide();
            self.render();
        });

        /* Export dropdown */
        $('#exportPdfBtn').on('click', function () {
            if (!self.config.exportColumns) {
                notify({ message: 'Export not configured', type: 'error' });
                return;
            }
            exportToPDF(self.items, self.config.sectionName || 'Data', self.config.exportColumns);
        });

        $('#exportDocBtn').on('click', function () {
            if (!self.config.exportColumns) {
                notify({ message: 'Export not configured', type: 'error' });
                return;
            }
            exportToDOCX(self.items, self.config.sectionName || 'Data', self.config.exportColumns);
        });

        $('#exportBtn').on('click', function (e) {
            e.stopPropagation();
            $('#exportMenu').toggleClass('open');
        });

        $(document).on('click', function () { $('#exportMenu').removeClass('open'); });
        $('#exportMenu').on('click', function (e) { e.stopPropagation(); });

        $('#modalClose, #cancelBtn').on('click', function () { self.closeModal(); });
        $('#itemForm').on('submit', function (e) { self.save(e); });

        $('.filter-bar, .filter-toolbar').on('click', '.filter-btn', function () {
            $('.filter-btn').removeClass('active');
            $(this).addClass('active');
            self.filter = $(this).data('filter') || 'all';
            self.render();
        });

        $('#searchInput').on('input', function () {
            self.searchQuery = $(this).val().toLowerCase().trim();
            self.render();
        });

        $('#modalOverlay').on('click', function (e) {
            if (e.target === this) self.closeModal();
        });

        /* Card actions */
        $('#grid').on('click', '.cc-btn.btn-edit', function (e) {
            e.stopPropagation();
            if (self.bulkMode) return;
            var id = $(this).data('id');
            var item = self.items.find(function (i) { return i.id === id; });
            if (item) self.openModal(item);
        });
        $('#grid').on('click', '.cc-btn.btn-delete', function (e) {
            e.stopPropagation();
            if (self.bulkMode) return;
            self.deleteItem($(this).data('id'));
        });
        $('#grid').on('click', '.cc-btn.btn-hide', function (e) {
            e.stopPropagation();
            if (self.bulkMode) return;
            var id = $(this).data('id');
            var item = self.items.find(function (i) { return i.id === id; });
            if (item) self.toggleVisibility(item);
        });

        /* Bulk select on card click */
        $('#grid').on('click', '.crud-card, .timeline-item', function (e) {
            if (!self.bulkMode) return;
            if ($(e.target).is('.cc-btn, i, button')) return;
            var id = $(this).data('id');
            if (self.selectedIds[id]) delete self.selectedIds[id];
            else self.selectedIds[id] = true;
            self.render();
            self.updateBulkBar();
        });

        /* Color sync */
        $('#color').on('input', function () { $('#colorHex').val($(this).val()); });
        $('#colorHex').on('input', function () {
            if (/^#[0-9A-F]{6}$/i.test($(this).val())) $('#color').val($(this).val());
        });

        /* Toggles */
        $('#visibleToggle').on('click', function () {
            $(this).toggleClass('on');
            $('#visible').val($(this).hasClass('on') ? 'yes' : 'no');
        });
        $('#featuredToggle').on('click', function () {
            $(this).toggleClass('on');
            $('#featured').val($(this).hasClass('on') ? 'yes' : 'no');
        });

        /* Range */
        $('#percent').on('input', function () { $('#percentValue').text($(this).val() + '%'); });

        /* Image upload */
        $(document).on('change', '.image-upload-input', function () {
            var file = this.files[0];
            var $btn = $(this).siblings('.image-upload-btn');
            var $preview = $(this).siblings('.image-preview');
            var $hidden = $('#' + $(this).data('target'));
            if (!file) return;
            $btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Processing...').prop('disabled', true);
            handleImageUpload(file, function (dataUrl) {
                if (dataUrl) {
                    $hidden.val(dataUrl);
                    $preview.attr('src', dataUrl).show();
                    $btn.html('<i class="fa-solid fa-check"></i> Image Ready');
                    setTimeout(function () { $btn.html('<i class="fa-solid fa-upload"></i> Change Image').prop('disabled', false); }, 1500);
                } else {
                    $btn.html('<i class="fa-solid fa-upload"></i> Upload Image').prop('disabled', false);
                }
            });
        });
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
                $('#grid').html('<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Connection Error</h3></div>');
            });
    },

    matchesSearch: function (item) {
        if (!this.searchQuery) return true;
        return JSON.stringify(item).toLowerCase().indexOf(this.searchQuery) > -1;
    },

    getFiltered: function () {
        var self = this;
        var filtered = self.items;
        if (self.config.filterFn) {
            filtered = filtered.filter(function (i) { return self.config.filterFn(i, self.filter); });
        }
        filtered = filtered.filter(function (i) { return self.matchesSearch(i); });
        if (self.config.sortFn) filtered = self.config.sortFn(filtered);
        return filtered;
    },

    render: function () {
        var self = this;
        var filtered = self.getFiltered();

        if (typeof self.config.updateCounts === 'function') {
            self.config.updateCounts(self.items);
        }

        if (filtered.length === 0) {
            var msg = self.searchQuery ?
                '<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><h3>No results found</h3><p>Try a different search term</p></div>' :
                '<div class="empty-state"><i class="fa-solid ' + (self.config.emptyIcon || 'fa-folder-open') + '"></i><h3>' + (self.config.emptyText || 'Nothing here yet') + '</h3><p>Click "Add New" to create your first item</p><button class="btn-add-first" onclick="document.getElementById(\'addBtn\').click()"><i class="fa-solid fa-plus"></i> Add First Item</button></div>';
            $('#grid').html(msg);
            return;
        }

        var html = filtered.map(function (item) {
            var card = self.config.renderCard(item);
            if (self.bulkMode) {
                var checked = self.selectedIds[item.id] ? 'checked' : '';
                var checkboxHtml = '<div class="bulk-checkbox ' + (checked ? 'checked' : '') + '"><i class="fa-solid fa-check"></i></div>';
                /* Insert checkbox right after the opening div */
                card = card.replace(/^(<div[^>]+>)/, '$1' + checkboxHtml);
            }
            return card;
        }).join('');
        $('#grid').html(html);

        if (self.searchQuery) {
            $('#searchResultCount').text(filtered.length + ' result' + (filtered.length !== 1 ? 's' : '')).show();
        } else {
            $('#searchResultCount').hide();
        }
    },

    updateBulkBar: function () {
        var count = Object.keys(this.selectedIds).length;
        $('#bulkSelectedCount').text(count);
        $('#bulkDeleteBtn').prop('disabled', count === 0);
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
            $('.image-preview').hide().attr('src', '');
            $('.image-upload-input').val('');
            $('.image-upload-btn').html('<i class="fa-solid fa-upload"></i> Upload Image');
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
                    notify({ message: res.action === 'updated' ? 'Updated!' : 'Saved!', type: 'success' });
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
            });
    },

    bulkDelete: function () {
        var self = this;
        var ids = Object.keys(self.selectedIds);
        if (ids.length === 0) return;
        if (!confirm('Delete ' + ids.length + ' items? This cannot be undone.')) return;

        notify({ message: 'Deleting ' + ids.length + ' items...', type: 'warning' });

        var promise = Promise.resolve();
        var deleted = 0, failed = 0;

        ids.forEach(function (id) {
            promise = promise.then(function () {
                var fd = new FormData();
                fd.append('action', self.config.deleteAction);
                fd.append('secret', HananAuth.getSecret());
                fd.append('id', id);
                return fetch(HananAuth.getApiUrl(), { method: 'POST', body: fd })
                    .then(function (r) { return r.json(); })
                    .then(function (res) {
                        if (res && res.ok) deleted++;
                        else failed++;
                        return new Promise(function (r) { setTimeout(r, 350); });
                    });
            });
        });

        promise.then(function () {
            try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
            notify({ message: 'Deleted ' + deleted + ' items' + (failed ? ' (' + failed + ' failed)' : ''), type: 'success' });
            self.bulkMode = false;
            self.selectedIds = {};
            $('#bulkModeBtn').removeClass('active');
            $('#bulkActionBar').hide();
            self.loadItems();
        });
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
