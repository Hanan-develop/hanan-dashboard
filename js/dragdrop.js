/* =========================================================
   HANAN DASHBOARD - DRAG-DROP HELPER
   For reordering services and achievements
   ========================================================= */

window.DragDrop = {
    init: function (sectionKey, gridSelector) {
        var self = this;
        self.sectionKey = sectionKey;
        self.gridSelector = gridSelector || '#grid';
        self.draggedEl = null;
        self.active = false;

        /* Add reorder toggle to topbar */
        var btn = '<button class="btn-reorder" id="reorderBtn" title="Reorder mode"><i class="fa-solid fa-arrows-up-down"></i> <span>Reorder</span></button>';
        if (!$('#reorderBtn').length) {
            $('.topbar-actions').prepend(btn);
        }

        /* Add reorder banner */
        if (!$('.reorder-banner').length) {
            $('main.main').find('.topbar').after(
                '<div class="reorder-banner" id="reorderBanner">' +
                '<i class="fa-solid fa-arrows-up-down"></i> ' +
                'Drag cards to reorder. Click Save when done.' +
                '<button id="saveOrderBtn"><i class="fa-solid fa-check"></i> Save Order</button>' +
                '</div>'
            );
        }

        $('#reorderBtn').on('click', function () { self.toggle(); });
        $('#saveOrderBtn').on('click', function () { self.save(); });

        /* Drag events */
        $(document).on('dragstart', '.crud-card', function (e) {
            if (!self.active) return;
            self.draggedEl = this;
            $(this).addClass('drag-ghost');
            try { e.originalEvent.dataTransfer.effectAllowed = 'move'; } catch (err) {}
        });

        $(document).on('dragend', '.crud-card', function () {
            if (!self.active) return;
            $(this).removeClass('drag-ghost');
            $('.drag-target-before, .drag-target-after').removeClass('drag-target-before drag-target-after');
            self.draggedEl = null;
        });

        $(document).on('dragover', '.crud-card', function (e) {
            if (!self.active || this === self.draggedEl) return;
            e.preventDefault();
            try { e.originalEvent.dataTransfer.dropEffect = 'move'; } catch (err) {}
            var rect = this.getBoundingClientRect();
            var mid = rect.top + rect.height / 2;
            $('.drag-target-before, .drag-target-after').removeClass('drag-target-before drag-target-after');
            if (e.originalEvent.clientY < mid) $(this).addClass('drag-target-before');
            else $(this).addClass('drag-target-after');
        });

        $(document).on('drop', '.crud-card', function (e) {
            if (!self.active || !self.draggedEl || this === self.draggedEl) return;
            e.preventDefault();
            var $target = $(this);
            var $dragged = $(self.draggedEl);
            if ($target.hasClass('drag-target-before')) $target.before($dragged);
            else $target.after($dragged);
            $('.drag-target-before, .drag-target-after').removeClass('drag-target-before drag-target-after');
        });
    },

    toggle: function () {
        var self = this;
        self.active = !self.active;
        $('#reorderBtn').toggleClass('active', self.active);
        $('#reorderBanner').toggleClass('active', self.active);
        if (self.active) {
            $(self.gridSelector + ' .crud-card').attr('draggable', 'true').addClass('draggable');
            notify({ message: 'Drag cards to reorder, then click Save', type: 'warning' });
        } else {
            $(self.gridSelector + ' .crud-card').removeAttr('draggable').removeClass('draggable');
        }
    },

    save: function () {
        var self = this;
        var ids = [];
        $(self.gridSelector + ' .crud-card').each(function () {
            var id = $(this).data('id') || $(this).attr('data-id');
            if (id) ids.push(id);
        });

        if (!ids.length) {
            notify({ message: 'No items to reorder', type: 'warning' });
            return;
        }

        $('#saveOrderBtn').prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Saving...');

        var fd = new FormData();
        fd.append('action', 'reorderItems');
        fd.append('secret', HananAuth.getSecret());
        fd.append('section', self.sectionKey);
        fd.append('orderedIds', ids.join(','));

        fetch(HananAuth.getApiUrl(), { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                $('#saveOrderBtn').prop('disabled', false).html('<i class="fa-solid fa-check"></i> Save Order');
                if (res && res.ok) {
                    try { localStorage.removeItem('hanan_dashboard_cache'); } catch (e) {}
                    notify({ message: 'Order saved!', type: 'success' });
                    self.toggle();
                    /* Reload to ensure clean state */
                    setTimeout(function () { window.location.reload(); }, 800);
                } else {
                    notify({ message: 'Failed: ' + (res.error || 'Unknown'), type: 'error' });
                }
            })
            .catch(function () {
                $('#saveOrderBtn').prop('disabled', false).html('<i class="fa-solid fa-check"></i> Save Order');
                notify({ message: 'Connection error', type: 'error' });
            });
    }
};
