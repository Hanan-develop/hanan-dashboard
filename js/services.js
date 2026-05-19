/* SERVICES PAGE - Phase 1 */
$(function () {
    CRUD.init({
        endpoint: 'getServices',
        saveAction: 'saveService',
        deleteAction: 'deleteService',
        dataKey: 'services',
        emptyIcon: 'fa-briefcase',
        emptyText: 'No services yet',
        filterFn: function (s, f) {
            if (f === 'visible') return s.visible !== 'no';
            if (f === 'hidden') return s.visible === 'no';
            return true;
        },
        updateCounts: function (items) {
            var visible = items.filter(function (i) { return i.visible !== 'no'; }).length;
            var hidden = items.filter(function (i) { return i.visible === 'no'; }).length;
            var tagged = items.filter(function (i) { return i.tag; }).length;
            $('#statTotal').text(items.length);
            $('#statVisible').text(visible);
            $('#statHidden').text(hidden);
            $('#statTagged').text(tagged);
        },
        sortFn: function (items) {
            return items.slice().sort(function (a, b) { return (parseInt(a.orderNum) || 99) - (parseInt(b.orderNum) || 99); });
        },
        renderCard: function (s) {
            var ic = (s.icon || 'fa-briefcase').indexOf('fa-') === 0 ? (s.icon.indexOf('wordpress') !== -1 || s.icon.indexOf('shopify') !== -1 ? 'fa-brands ' + s.icon : 'fa-solid ' + s.icon) : s.icon;
            var features = (s.features || '').split('\n').filter(function (f) { return f.trim(); }).slice(0, 4);
            var fhtml = features.length ? '<ul style="list-style:none;padding:0;margin:0 0 1rem;display:flex;flex-direction:column;gap:0.3rem;">' + features.map(function (f) { return '<li style="font-size:1.1rem;color:var(--text-soft);display:flex;align-items:center;gap:0.5rem;"><i class="fa-solid fa-check" style="color:var(--success);font-size:0.9rem;"></i> ' + escapeHtml(f) + '</li>'; }).join('') + '</ul>' : '';
            var tag = s.tag ? '<span class="cc-badge ' + (s.tag === 'featured' ? 'featured' : '') + '">' + escapeHtml(s.tag.toUpperCase()) + '</span>' : '';
            var hidden = s.visible === 'no' ? 'hidden' : '';
            return '<div class="crud-card ' + hidden + '" style="--card-color:' + escapeHtml(s.color || '#f9ca24') + ';" data-id="' + s.id + '">' +
                '<div class="cc-head"><div class="cc-icon"><i class="' + ic + '"></i></div>' +
                '<div class="cc-meta"><div class="cc-title">' + escapeHtml(s.title) + '</div><div class="cc-badges">' + tag + '</div></div></div>' +
                '<div class="cc-description">' + escapeHtml(s.description) + '</div>' + fhtml +
                '<div class="cc-footer"><span class="cc-meta-text">Order: #' + (s.orderNum || 1) + '</span>' +
                '<div class="cc-actions">' +
                '<button class="cc-btn btn-hide" data-id="' + s.id + '"><i class="fa-solid fa-' + (s.visible === 'no' ? 'eye' : 'eye-slash') + '"></i></button>' +
                '<button class="cc-btn btn-edit" data-id="' + s.id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="cc-btn btn-delete" data-id="' + s.id + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div></div></div>';
        },
        populateForm: function (s) {
            $('#itemId').val(s.id);
            $('#title').val(s.title);
            $('#description').val(s.description);
            $('#icon').val(s.icon || 'fa-briefcase');
            $('#color').val(s.color || '#f9ca24');
            $('#colorHex').val(s.color || '#f9ca24');
            $('#features').val(s.features || '');
            $('#orderNum').val(s.orderNum || 1);
            $('#tag').val(s.tag || '');
            var vis = s.visible !== 'no';
            $('#visibleToggle').toggleClass('on', vis);
            $('#visible').val(vis ? 'yes' : 'no');
        },
        resetForm: function () {
            $('#icon').val('fa-briefcase');
            $('#color').val('#f9ca24');
            $('#colorHex').val('#f9ca24');
            $('#visibleToggle').addClass('on');
            $('#visible').val('yes');
        },
        getFormData: function () {
            return {
                id: $('#itemId').val() || undefined,
                title: $('#title').val(),
                description: $('#description').val(),
                icon: $('#icon').val() || 'fa-briefcase',
                color: $('#colorHex').val(),
                features: $('#features').val(),
                orderNum: $('#orderNum').val() || 1,
                tag: $('#tag').val(),
                visible: $('#visible').val() || 'yes'
            };
        }
    });
});
