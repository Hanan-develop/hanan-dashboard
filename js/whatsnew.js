/* WHAT'S NEW PAGE - Phase 1 */
$(function () {
    CRUD.init({
        endpoint: 'getWhatsNew',
        saveAction: 'saveWhatsNew',
        deleteAction: 'deleteWhatsNew',
        dataKey: 'updates',
        emptyIcon: 'fa-bullhorn',
        emptyText: 'No updates yet',
        filterFn: function (u, f) {
            if (f === 'all') return true;
            return (u.tag || '').toUpperCase() === f.toUpperCase();
        },
        sortFn: function (items) {
            return items.slice().sort(function (a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
        },
        renderCard: function (u) {
            var d = u.date ? new Date(u.date) : null;
            var dateStr = d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
            return '<div class="timeline-item" data-id="' + u.id + '">' +
                '<div class="tl-head">' +
                '<span class="tl-tag ' + escapeHtml(u.tag || 'UPDATE') + '">' + escapeHtml(u.tag || 'UPDATE') + '</span>' +
                '<span class="tl-date">' + dateStr + '</span>' +
                '</div>' +
                '<div class="tl-title">' + escapeHtml(u.title) + '</div>' +
                '<div class="tl-desc">' + escapeHtml(u.description) + '</div>' +
                '<div class="tl-actions">' +
                '<button class="cc-btn btn-edit" data-id="' + u.id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="cc-btn btn-delete" data-id="' + u.id + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div></div>';
        },
        populateForm: function (u) {
            $('#itemId').val(u.id);
            $('#title').val(u.title);
            $('#tag').val(u.tag || 'NEW');
            $('#date').val(u.date ? new Date(u.date).toISOString().split('T')[0] : '');
            $('#description').val(u.description);
            $('#link').val(u.link || '');
        },
        resetForm: function () {
            $('#date').val(new Date().toISOString().split('T')[0]);
        },
        getFormData: function () {
            return {
                id: $('#itemId').val() || undefined,
                title: $('#title').val(),
                tag: $('#tag').val(),
                date: $('#date').val(),
                description: $('#description').val(),
                link: $('#link').val()
            };
        }
    });
});
