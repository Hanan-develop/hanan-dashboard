/* PROJECTS PAGE */
$(function () {
    CRUD.init({
        endpoint: 'getProjects',
        saveAction: 'saveProject',
        deleteAction: 'deleteProject',
        dataKey: 'projects',
        emptyIcon: 'fa-folder-open',
        emptyText: 'No projects yet',
        renderCard: function (p) {
            return '<div class="crud-card" style="--card-color:' + escapeHtml(p.color || '#f9ca24') + ';" data-id="' + p.id + '">' +
                '<div class="cc-head"><div class="cc-icon"><i class="fa-solid fa-folder-open"></i></div>' +
                '<div class="cc-meta"><div class="cc-title">' + escapeHtml(p.title) + '</div>' +
                '<div class="cc-badges">' + (p.category ? '<span class="cc-badge">' + escapeHtml(p.category) + '</span>' : '') + '</div></div></div>' +
                '<div class="cc-description">' + escapeHtml(p.description || '') + '</div>' +
                (p.tech ? '<div class="cc-meta-text" style="margin-bottom:0.7rem;"><i class="fa-solid fa-microchip"></i> ' + escapeHtml(p.tech) + '</div>' : '') +
                '<div class="cc-footer"><a href="' + escapeHtml(p.liveUrl || '#') + '" target="_blank" class="cc-meta-text">' + (p.liveUrl ? '<i class="fa-solid fa-external-link"></i> View Live' : '') + '</a>' +
                '<div class="cc-actions">' +
                '<button class="cc-btn btn-edit" data-id="' + p.id + '" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="cc-btn btn-delete" data-id="' + p.id + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
                '</div></div></div>';
        },
        populateForm: function (p) {
            $('#itemId').val(p.id);
            $('#title').val(p.title);
            $('#category').val(p.category || '');
            $('#color').val(p.color || '#f9ca24');
            $('#colorHex').val(p.color || '#f9ca24');
            $('#description').val(p.description || '');
            $('#imageUrl').val(p.imageUrl || '');
            $('#liveUrl').val(p.liveUrl || '');
            $('#tech').val(p.tech || '');
        },
        resetForm: function () {
            $('#color').val('#f9ca24');
            $('#colorHex').val('#f9ca24');
        },
        getFormData: function () {
            return {
                id: $('#itemId').val() || undefined,
                title: $('#title').val(),
                category: $('#category').val(),
                color: $('#colorHex').val(),
                description: $('#description').val(),
                imageUrl: $('#imageUrl').val(),
                liveUrl: $('#liveUrl').val(),
                tech: $('#tech').val()
            };
        }
    });
});
