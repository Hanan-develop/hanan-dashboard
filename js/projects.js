/* PROJECTS PAGE - Phase 2 */
$(function () {
    CRUD.init({
        endpoint: 'getProjects',
        saveAction: 'saveProject',
        deleteAction: 'deleteProject',
        dataKey: 'projects',
        emptyIcon: 'fa-folder-open',
        emptyText: 'No projects yet',
        sectionName: 'Projects',
        exportColumns: [
            { key: 'title', label: 'Title' },
            { key: 'category', label: 'Category' },
            { key: 'description', label: 'Description' },
            { key: 'tech', label: 'Tech Stack' },
            { key: 'liveUrl', label: 'Live URL' },
            { key: 'createdAt', label: 'Created', format: 'date' }
        ],
        updateCounts: function (items) {
            var cats = {};
            var live = 0;
            items.forEach(function (p) {
                if (p.category) cats[p.category] = true;
                if (p.liveUrl) live++;
            });
            $('#statTotal').text(items.length);
            $('#statCategories').text(Object.keys(cats).length);
            $('#statLive').text(live);
        },
        renderCard: function (p) {
            return '<div class="crud-card" style="--card-color:' + escapeHtml(p.color || '#f9ca24') + ';" data-id="' + p.id + '">' +
                '<div class="cc-head"><div class="cc-icon"><i class="fa-solid fa-folder-open"></i></div>' +
                '<div class="cc-meta"><div class="cc-title">' + escapeHtml(p.title) + '</div>' +
                '<div class="cc-badges">' + (p.category ? '<span class="cc-badge">' + escapeHtml(p.category) + '</span>' : '') + '</div></div></div>' +
                (p.imageUrl ? '<img src="' + escapeHtml(p.imageUrl) + '" style="width:100%;max-height:14rem;object-fit:cover;border-radius:0.6rem;margin-bottom:0.8rem;" loading="lazy"/>' : '') +
                '<div class="cc-description">' + escapeHtml(p.description || '') + '</div>' +
                (p.tech ? '<div class="cc-meta-text" style="margin-bottom:0.7rem;"><i class="fa-solid fa-microchip"></i> ' + escapeHtml(p.tech) + '</div>' : '') +
                '<div class="cc-footer">' + (p.liveUrl ? '<a href="' + escapeHtml(p.liveUrl) + '" target="_blank" class="cc-meta-text"><i class="fa-solid fa-external-link"></i> View Live</a>' : '<span></span>') +
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
            if (p.imageUrl) $('.image-preview').attr('src', p.imageUrl).show();
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
