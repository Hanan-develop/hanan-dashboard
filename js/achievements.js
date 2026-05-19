/* ACHIEVEMENTS PAGE - Phase 3 (with drag-drop) */
$(function () {
    CRUD.init({
        endpoint: 'getAchievements',
        saveAction: 'saveAchievement',
        deleteAction: 'deleteAchievement',
        dataKey: 'achievements',
        emptyIcon: 'fa-trophy',
        emptyText: 'No achievements yet',
        sectionName: 'Achievements',
        exportColumns: [
            { key: 'title', label: 'Achievement' },
            { key: 'description', label: 'Description' },
            { key: 'year', label: 'Year' },
            { key: 'category', label: 'Category' },
            { key: 'tag', label: 'Tag' },
            { key: 'orderNum', label: 'Order' }
        ],
        filterFn: function (a, f) {
            if (f === 'visible') return a.visible !== 'no';
            if (f === 'hidden') return a.visible === 'no';
            return true;
        },
        updateCounts: function (items) {
            var visible = items.filter(function (i) { return i.visible !== 'no'; }).length;
            var hidden = items.filter(function (i) { return i.visible === 'no'; }).length;
            var years = {};
            items.forEach(function (i) { if (i.year) years[i.year] = true; });
            $('#statTotal').text(items.length);
            $('#statVisible').text(visible);
            $('#statHidden').text(hidden);
            $('#statYears').text(Object.keys(years).length);
        },
        sortFn: function (items) {
            return items.slice().sort(function (a, b) { return (parseInt(a.orderNum) || 99) - (parseInt(b.orderNum) || 99); });
        },
        renderCard: function (a) {
            var ic = (a.icon || 'fa-trophy').indexOf('fa-') === 0 ? 'fa-solid ' + a.icon : a.icon;
            var tag = a.tag ? '<span class="cc-badge ' + (a.tag === 'featured' || a.tag === 'major' ? 'featured' : '') + '">' + escapeHtml(a.tag.toUpperCase()) + '</span>' : '';
            var hidden = a.visible === 'no' ? 'hidden' : '';
            return '<div class="crud-card ' + hidden + '" style="--card-color:' + escapeHtml(a.color || '#f9ca24') + ';" data-id="' + a.id + '">' +
                '<div class="cc-head"><div class="cc-icon"><i class="' + ic + '"></i></div>' +
                '<div class="cc-meta"><div class="cc-title">' + escapeHtml(a.title) + '</div>' +
                '<div class="cc-badges"><span class="cc-badge">' + escapeHtml(a.year || '2025') + '</span><span class="cc-badge">' + escapeHtml((a.category || 'milestone').toUpperCase()) + '</span>' + tag + '</div></div></div>' +
                '<div class="cc-description">' + escapeHtml(a.description) + '</div>' +
                '<div class="cc-footer"><span class="cc-meta-text">Order: #' + (a.orderNum || 1) + '</span>' +
                '<div class="cc-actions">' +
                '<button class="cc-btn btn-hide" data-id="' + a.id + '"><i class="fa-solid fa-' + (a.visible === 'no' ? 'eye' : 'eye-slash') + '"></i></button>' +
                '<button class="cc-btn btn-edit" data-id="' + a.id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="cc-btn btn-delete" data-id="' + a.id + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div></div></div>';
        },
        populateForm: function (a) {
            $('#itemId').val(a.id);
            $('#title').val(a.title);
            $('#description').val(a.description);
            $('#year').val(a.year || '2025');
            $('#category').val(a.category || 'career');
            $('#icon').val(a.icon || 'fa-trophy');
            $('#color').val(a.color || '#f9ca24');
            $('#colorHex').val(a.color || '#f9ca24');
            $('#orderNum').val(a.orderNum || 1);
            $('#tag').val(a.tag || '');
            var vis = a.visible !== 'no';
            $('#visibleToggle').toggleClass('on', vis);
            $('#visible').val(vis ? 'yes' : 'no');
        },
        resetForm: function () {
            $('#icon').val('fa-trophy');
            $('#color').val('#f9ca24');
            $('#colorHex').val('#f9ca24');
            $('#year').val('2025');
            $('#visibleToggle').addClass('on');
            $('#visible').val('yes');
        },
        getFormData: function () {
            return {
                id: $('#itemId').val() || undefined,
                title: $('#title').val(),
                description: $('#description').val(),
                year: $('#year').val() || '2025',
                category: $('#category').val() || 'career',
                icon: $('#icon').val() || 'fa-trophy',
                color: $('#colorHex').val(),
                orderNum: $('#orderNum').val() || 1,
                tag: $('#tag').val(),
                visible: $('#visible').val() || 'yes'
            };
        }
    });

    /* Phase 3: Initialize drag-drop */
    if (window.DragDrop) DragDrop.init('achievements', '#grid');
});
