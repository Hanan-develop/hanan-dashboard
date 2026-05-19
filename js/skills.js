/* SKILLS PAGE - Phase 1 */
$(function () {
    CRUD.init({
        endpoint: 'getSkills',
        saveAction: 'saveSkill',
        deleteAction: 'deleteSkill',
        dataKey: 'skills',
        emptyIcon: 'fa-code',
        emptyText: 'No skills yet',
        filterFn: function (s, f) {
            if (f === 'expert') return s.level === 'Expert';
            if (f === 'advanced') return s.level === 'Advanced';
            return true;
        },
        updateCounts: function (items) {
            var cats = {};
            var totalPercent = 0;
            items.forEach(function (s) {
                if (s.category) cats[s.category] = true;
                totalPercent += parseInt(s.percent) || 0;
            });
            var avg = items.length ? Math.round(totalPercent / items.length) : 0;
            $('#statTotal').text(items.length);
            $('#statCategories').text(Object.keys(cats).length);
            $('#statAvgPercent').text(avg + '%');
        },
        renderCard: function (s) {
            var ic = (s.icon || 'fa-code').indexOf('fa-') === 0 ? (s.icon.indexOf('wordpress') !== -1 || s.icon.indexOf('shopify') !== -1 ? 'fa-brands ' + s.icon : 'fa-solid ' + s.icon) : s.icon;
            var p = parseInt(s.percent) || 0;
            return '<div class="crud-card" style="--card-color:' + escapeHtml(s.color || '#f9ca24') + ';" data-id="' + s.id + '">' +
                '<div class="cc-head"><div class="cc-icon"><i class="' + ic + '"></i></div>' +
                '<div class="cc-meta"><div class="cc-title">' + escapeHtml(s.name) + '</div>' +
                '<div class="cc-badges"><span class="cc-badge">' + escapeHtml(s.category || 'Skill') + '</span><span class="cc-badge">' + escapeHtml(s.level || 'Intermediate') + '</span></div></div></div>' +
                '<div class="skill-progress-wrap"><div class="skill-percent-text">' + p + '%</div><div class="skill-bar"><div class="skill-bar-fill" style="width:' + p + '%;background:' + escapeHtml(s.color || '#f9ca24') + ';"></div></div></div>' +
                '<div class="cc-footer" style="margin-top:1rem;"><span></span>' +
                '<div class="cc-actions">' +
                '<button class="cc-btn btn-edit" data-id="' + s.id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="cc-btn btn-delete" data-id="' + s.id + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div></div></div>';
        },
        populateForm: function (s) {
            $('#itemId').val(s.id);
            $('#name').val(s.name);
            $('#category').val(s.category || '');
            $('#icon').val(s.icon || 'fa-code');
            $('#color').val(s.color || '#f9ca24');
            $('#colorHex').val(s.color || '#f9ca24');
            $('#level').val(s.level || 'Intermediate');
            $('#percent').val(s.percent || 50);
            $('#percentValue').text((s.percent || 50) + '%');
        },
        resetForm: function () {
            $('#icon').val('fa-code');
            $('#color').val('#f9ca24');
            $('#colorHex').val('#f9ca24');
            $('#percent').val(50);
            $('#percentValue').text('50%');
        },
        getFormData: function () {
            return {
                id: $('#itemId').val() || undefined,
                name: $('#name').val(),
                category: $('#category').val(),
                icon: $('#icon').val() || 'fa-code',
                color: $('#colorHex').val(),
                level: $('#level').val(),
                percent: $('#percent').val()
            };
        }
    });
});
