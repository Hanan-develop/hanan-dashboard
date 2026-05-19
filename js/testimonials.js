/* TESTIMONIALS PAGE - Phase 1 */
$(function () {
    CRUD.init({
        endpoint: 'getTestimonials',
        saveAction: 'saveTestimonial',
        deleteAction: 'deleteTestimonial',
        dataKey: 'testimonials',
        emptyIcon: 'fa-star',
        emptyText: 'No reviews yet',
        filterFn: function (t, f) {
            if (f === 'featured') return (t.featured === true || t.featured === 'yes');
            if (f === '5star') return (parseInt(t.rating) || 0) === 5;
            return true;
        },
        updateCounts: function (items) {
            var featured = items.filter(function (t) { return t.featured === true || t.featured === 'yes'; }).length;
            var total = items.length;
            var avg = total ? (items.reduce(function (s, t) { return s + (parseInt(t.rating) || 5); }, 0) / total).toFixed(1) : '0.0';
            $('#statTotal').text(total);
            $('#statFeatured').text(featured);
            $('#statAvg').text(avg);
        },
        renderCard: function (t) {
            var stars = '';
            for (var i = 0; i < 5; i++) stars += i < (parseInt(t.rating) || 5) ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
            var featured = (t.featured === true || t.featured === 'yes') ? '<span class="cc-badge featured">FEATURED</span>' : '';
            return '<div class="crud-card" style="--card-color:#a855f7;" data-id="' + t.id + '">' +
                '<div class="cc-head"><div class="cc-icon" style="background:linear-gradient(135deg,#a855f7,#ec4899);"><i class="fa-solid fa-quote-left"></i></div>' +
                '<div class="cc-meta"><div class="cc-title">' + escapeHtml(t.name) + '</div>' +
                '<div class="stars-row">' + stars + '</div>' +
                '<div class="cc-badges">' + (t.role ? '<span class="cc-badge">' + escapeHtml(t.role) + '</span>' : '') + featured + '</div></div></div>' +
                '<div class="cc-description">"' + escapeHtml(t.message) + '"</div>' +
                '<div class="cc-footer">' +
                '<span class="cc-meta-text">' + escapeHtml(t.company || '') + '</span>' +
                '<div class="cc-actions">' +
                '<button class="cc-btn btn-edit" data-id="' + t.id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="cc-btn btn-delete" data-id="' + t.id + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div></div></div>';
        },
        populateForm: function (t) {
            $('#itemId').val(t.id);
            $('#name').val(t.name);
            $('#role').val(t.role || '');
            $('#company').val(t.company || '');
            $('#message').val(t.message);
            $('#rating').val(t.rating || 5);
            $('#avatar').val(t.avatar || '');
            var feat = (t.featured === true || t.featured === 'yes');
            $('#featuredToggle').toggleClass('on', feat);
            $('#featured').val(feat ? 'yes' : 'no');
        },
        resetForm: function () {
            $('#featuredToggle').removeClass('on');
            $('#featured').val('no');
        },
        getFormData: function () {
            return {
                id: $('#itemId').val() || undefined,
                name: $('#name').val(),
                role: $('#role').val(),
                company: $('#company').val(),
                message: $('#message').val(),
                rating: $('#rating').val(),
                avatar: $('#avatar').val(),
                featured: $('#featured').val()
            };
        }
    });
});
