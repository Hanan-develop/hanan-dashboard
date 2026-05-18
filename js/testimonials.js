/* =========================================================
   TESTIMONIALS PAGE - FULL CRUD
   ========================================================= */

(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = HananAuth.getApiUrl();
    var SECRET_KEY = HananAuth.getSecret();

    var allTestimonials = [];
    var currentFilter = 'all';
    var currentSearch = '';
    var editingId = null;
    var currentRating = 5;
    var currentFeatured = false;

    // ===== HELPERS =====

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getInitials(name) {
        if (!name) return '?';
        var parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    function showFormError(msg) {
        $('#formError').text(msg).addClass('show');
        setTimeout(function () { $('#formError').removeClass('show'); }, 5000);
    }

    function renderStars(rating, display) {
        var html = '';
        for (var i = 1; i <= 5; i++) {
            html += '<i class="fa-solid fa-star star ' + (i <= rating ? 'filled' : '') + '"></i>';
        }
        return display ? '<div class="star-rating-display">' + html + '</div>' : html;
    }

    // ===== FETCH =====

    function fetchTestimonials() {
        $('#testimonialsGrid').html(
            '<div class="loading-state">' +
            '<div class="loader-spinner"></div>' +
            '<p>Loading testimonials from Google Sheets...</p>' +
            '</div>'
        );

        fetch(GOOGLE_SCRIPT_URL + '?action=getTestimonials')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok) {
                    allTestimonials = data.testimonials || [];
                    updateStats();
                    renderTestimonials();
                } else {
                    showError(data.error || 'Failed to load testimonials');
                }
            })
            .catch(function (err) {
                console.error('Fetch error:', err);
                showError('Connection error. Check internet.');
            });
    }

    function showError(msg) {
        $('#testimonialsGrid').html(
            '<div class="empty-state">' +
            '<i class="fa-solid fa-triangle-exclamation"></i>' +
            '<h3>Error</h3><p>' + escapeHtml(msg) + '</p>' +
            '<button class="btn-add-first" onclick="location.reload()"><i class="fa-solid fa-arrows-rotate"></i> Retry</button>' +
            '</div>'
        );
    }

    function updateStats() {
        var total = allTestimonials.length;
        var featured = allTestimonials.filter(function (t) { return t.featured; }).length;
        var avgRating = 0;
        if (total > 0) {
            var sum = allTestimonials.reduce(function (s, t) { return s + (parseInt(t.rating) || 0); }, 0);
            avgRating = (sum / total).toFixed(1);
        }

        $('#totalCount').text(total);
        $('#featuredCount').text(featured);
        $('#avgRating').text(avgRating);
    }

    function renderTestimonials() {
        var filtered = allTestimonials.filter(function (t) {
            if (currentFilter === 'featured' && !t.featured) return false;
            if (currentFilter === '5' && parseInt(t.rating) !== 5) return false;
            if (currentFilter === '4' && parseInt(t.rating) < 4) return false;

            if (currentSearch) {
                var s = currentSearch.toLowerCase();
                var match = (t.name || '').toLowerCase().indexOf(s) > -1 ||
                            (t.message || '').toLowerCase().indexOf(s) > -1 ||
                            (t.company || '').toLowerCase().indexOf(s) > -1 ||
                            (t.role || '').toLowerCase().indexOf(s) > -1;
                if (!match) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            var msg = allTestimonials.length === 0
                ? 'Add your first testimonial to showcase client feedback!'
                : 'No testimonials match your filter.';

            $('#testimonialsGrid').html(
                '<div class="empty-state">' +
                '<i class="fa-solid fa-star"></i>' +
                '<h3>No testimonials yet</h3>' +
                '<p>' + msg + '</p>' +
                (allTestimonials.length === 0 ? '<button class="btn-add-first" id="emptyAddBtn"><i class="fa-solid fa-plus"></i> Add First Testimonial</button>' : '') +
                '</div>'
            );
            return;
        }

        var html = filtered.map(function (t) {
            var initials = getInitials(t.name);
            var avatarHtml = t.avatar
                ? '<img src="' + escapeHtml(t.avatar) + '" alt="' + escapeHtml(t.name) + '" onerror="this.parentElement.innerHTML=\'' + escapeHtml(initials) + '\'" />'
                : escapeHtml(initials);

            return (
                '<div class="testimonial-card ' + (t.featured ? 'featured' : '') + '">' +
                    '<div class="testi-actions-overlay">' +
                        '<button class="proj-action-btn edit" data-edit="' + t.id + '" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
                        '<button class="proj-action-btn delete" data-delete="' + t.id + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                    '<div class="testi-head">' +
                        '<div class="testi-avatar">' + avatarHtml + '</div>' +
                        '<div class="testi-info">' +
                            '<div class="testi-name">' + escapeHtml(t.name) + '</div>' +
                            '<div class="testi-role">' +
                                escapeHtml(t.role || '') +
                                (t.role && t.company ? ' · ' : '') +
                                escapeHtml(t.company || '') +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="testi-rating">' + renderStars(t.rating || 5, true) + '</div>' +
                    '<p class="testi-message">' + escapeHtml(t.message || '') + '</p>' +
                '</div>'
            );
        }).join('');

        $('#testimonialsGrid').html(html);

        // Bind actions
        $('.proj-action-btn.edit').on('click', function (e) {
            e.stopPropagation();
            openEditModal($(this).data('edit'));
        });
        $('.proj-action-btn.delete').on('click', function (e) {
            e.stopPropagation();
            confirmDelete($(this).data('delete'));
        });
    }

    // ===== Star Rating UI =====

    function setRating(rating) {
        currentRating = rating;
        $('#testiRating').val(rating);
        $('.star-rating .star').each(function () {
            var r = $(this).data('rating');
            $(this).toggleClass('active', r <= rating);
        });
    }

    function setupStarRating() {
        $('.star-rating .star').on('click', function () {
            setRating($(this).data('rating'));
        });
        $('.star-rating .star').on('mouseenter', function () {
            var hoverRating = $(this).data('rating');
            $('.star-rating .star').each(function () {
                var r = $(this).data('rating');
                $(this).toggleClass('hover', r <= hoverRating);
            });
        });
        $('.star-rating').on('mouseleave', function () {
            $('.star-rating .star').removeClass('hover');
        });
    }

    // ===== Featured Toggle =====

    function setFeatured(featured) {
        currentFeatured = featured;
        $('#testiFeatured').val(featured ? 'yes' : 'no');
        $('#featuredToggle').toggleClass('active', featured);
    }

    // ===== MODAL =====

    function openAddModal() {
        editingId = null;
        $('#modalTitle').text('Add New Testimonial');
        $('#testimonialForm')[0].reset();
        $('#testimonialId').val('');
        setRating(5);
        setFeatured(false);
        $('#testimonialModal').addClass('show');
        setTimeout(function () { $('#testiName').focus(); }, 300);
    }

    function openEditModal(id) {
        var t = allTestimonials.find(function (x) { return x.id === id; });
        if (!t) return;

        editingId = id;
        $('#modalTitle').text('Edit Testimonial');
        $('#testimonialId').val(t.id);
        $('#testiName').val(t.name || '');
        $('#testiRole').val(t.role || '');
        $('#testiCompany').val(t.company || '');
        $('#testiAvatar').val(t.avatar || '');
        $('#testiMessage').val(t.message || '');
        setRating(parseInt(t.rating) || 5);
        setFeatured(!!t.featured);
        $('#testimonialModal').addClass('show');
    }

    function closeModal() {
        $('#testimonialModal').removeClass('show');
        editingId = null;
    }

    function saveTestimonial() {
        var name = $('#testiName').val().trim();
        var role = $('#testiRole').val().trim();
        var company = $('#testiCompany').val().trim();
        var avatar = $('#testiAvatar').val().trim();
        var message = $('#testiMessage').val().trim();
        var rating = parseInt($('#testiRating').val()) || 5;
        var featured = $('#testiFeatured').val() === 'yes';

        if (!name) { showFormError('Name is required'); return; }
        if (!message) { showFormError('Message is required'); return; }
        if (message.length < 10) { showFormError('Message must be at least 10 characters'); return; }

        var $btn = $('#saveBtn');
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> <span>Saving...</span>');

        var formData = new FormData();
        formData.append('action', 'saveTestimonial');
        formData.append('secret', SECRET_KEY);
        if (editingId) formData.append('id', editingId);
        formData.append('name', name);
        formData.append('role', role);
        formData.append('company', company);
        formData.append('avatar', avatar);
        formData.append('message', message);
        formData.append('rating', rating);
        formData.append('featured', featured ? 'yes' : 'no');

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                $btn.prop('disabled', false).html('<i class="fa-solid fa-check"></i> <span>Save Testimonial</span>');

                if (res && res.ok) {
                    if (window.notify) {
                        notify({
                            title: editingId ? 'Testimonial Updated' : 'Testimonial Added',
                            message: editingId ? 'Changes saved successfully.' : 'New testimonial added to your portfolio.',
                            type: 'success',
                            persist: true
                        });
                    }
                    closeModal();
                    fetchTestimonials();
                } else {
                    showFormError(res.error || 'Failed to save');
                }
            })
            .catch(function (err) {
                console.error('Save error:', err);
                $btn.prop('disabled', false).html('<i class="fa-solid fa-check"></i> <span>Save Testimonial</span>');
                showFormError('Connection error');
            });
    }

    function confirmDelete(id) {
        var t = allTestimonials.find(function (x) { return x.id === id; });
        if (!t) return;

        var $modal = $(
            '<div class="modal show">' +
                '<div class="modal-backdrop" data-confirm-close></div>' +
                '<div class="modal-card confirm-modal" style="max-width: 44rem;">' +
                    '<div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
                    '<h2>Delete Testimonial?</h2>' +
                    '<p>Delete testimonial from <strong>"' + escapeHtml(t.name) + '"</strong>? This cannot be undone.</p>' +
                    '<div class="confirm-actions">' +
                        '<button class="btn-cancel" data-confirm-close>Cancel</button>' +
                        '<button class="btn-danger" id="confirmDeleteBtn"><i class="fa-solid fa-trash"></i> Delete</button>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );

        $('body').append($modal);

        $modal.on('click', '[data-confirm-close]', function () { $modal.remove(); });

        $modal.find('#confirmDeleteBtn').on('click', function () {
            var $btn = $(this);
            $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Deleting...');

            var formData = new FormData();
            formData.append('action', 'deleteTestimonial');
            formData.append('secret', SECRET_KEY);
            formData.append('id', id);

            fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    $modal.remove();
                    if (res && res.ok) {
                        allTestimonials = allTestimonials.filter(function (x) { return x.id !== id; });
                        updateStats();
                        renderTestimonials();
                        if (window.notify) {
                            notify({
                                title: 'Testimonial Deleted',
                                message: 'Testimonial removed.',
                                type: 'success',
                                persist: true
                            });
                        }
                    } else {
                        if (window.notify) notify({ message: res.error || 'Failed to delete', type: 'error' });
                    }
                })
                .catch(function (err) {
                    $modal.remove();
                    if (window.notify) notify({ message: 'Connection error', type: 'error' });
                });
        });
    }

    // ===== INIT =====
    $(document).ready(function () {
        if (!HananAuth.requireAuth()) return;

        var user = HananAuth.getCurrentUser();
        if (user) $('#sbUserName').text(user.charAt(0).toUpperCase() + user.slice(1));

        setupStarRating();

        $('#featuredToggle').on('click', function () {
            setFeatured(!currentFeatured);
        });

        fetchTestimonials();

        $('#addNewBtn').on('click', openAddModal);
        $(document).on('click', '#emptyAddBtn', openAddModal);

        $('#refreshBtn').on('click', function () {
            var $btn = $(this);
            $btn.prop('disabled', true).find('i').addClass('fa-spin');
            fetchTestimonials();
            setTimeout(function () { $btn.prop('disabled', false).find('i').removeClass('fa-spin'); }, 1000);
        });

        $('#testimonialForm').on('submit', function (e) {
            e.preventDefault();
            saveTestimonial();
        });

        $('#testimonialModal').on('click', '[data-close]', closeModal);
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && $('#testimonialModal').hasClass('show')) closeModal();
        });

        // Search
        var searchTimer;
        $('#searchInput').on('input', function () {
            var val = $(this).val();
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () {
                currentSearch = val;
                renderTestimonials();
            }, 200);
        });

        // Filter
        $('.fb').on('click', function () {
            $('.fb').removeClass('active');
            $(this).addClass('active');
            currentFilter = $(this).data('filter');
            renderTestimonials();
        });

        // Sidebar
        $('#sbToggle').on('click', function () { $('#sidebar').toggleClass('open'); });
        $('#logoutBtn').on('click', function () {
            if (confirm('Logout?')) HananAuth.logout();
        });
    });

})();
