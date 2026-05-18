/* =========================================================
   HANAN DASHBOARD - MESSAGES PAGE
   Fetches messages from Google Sheets API
   ========================================================= */

(function () {
    'use strict';

    // ===== CONFIG =====
    var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx2sQwvMTOCeNdiE255oLaoqXUHvdsKrcn423nUIqrwqRtcWTdUL6LPm9VJjVz4M6dE/exec';
    var SECRET_KEY = 'hanan_2026_secret';
    var POLL_INTERVAL = 60000; // Refresh every 60 seconds

    var allMessages = [];
    var currentFilter = 'all';
    var currentSearch = '';
    var pollTimer = null;

    // ===== Helpers =====

    function formatTime(isoString) {
        if (!isoString) return '—';
        var date = new Date(isoString);
        var now = new Date();
        var diffMs = now - date;
        var diffMins = Math.floor(diffMs / 60000);
        var diffHours = Math.floor(diffMs / 3600000);
        var diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return diffMins + 'm ago';
        if (diffHours < 24) return diffHours + 'h ago';
        if (diffDays < 7) return diffDays + 'd ago';

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function formatDateFull(isoString) {
        if (!isoString) return '—';
        var date = new Date(isoString);
        return date.toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long',
            day: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    }

    function getInitials(name) {
        if (!name) return '?';
        var parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function isToday(isoString) {
        if (!isoString) return false;
        var date = new Date(isoString);
        var now = new Date();
        return date.toDateString() === now.toDateString();
    }

    // ===== Fetch Messages =====

    function fetchMessages(showLoading) {
        if (showLoading) {
            $('#messagesContainer').html(
                '<div class="loading-state">' +
                '<div class="loader-spinner"></div>' +
                '<p>Loading messages from Google Sheets...</p>' +
                '</div>'
            );
        }

        return fetch(GOOGLE_SCRIPT_URL)
            .then(function (response) {
                if (!response.ok) throw new Error('Network response was not OK');
                return response.json();
            })
            .then(function (data) {
                if (data && data.ok) {
                    allMessages = data.messages || [];
                    updateStats();
                    renderMessages();
                } else {
                    showError(data && data.error ? data.error : 'Failed to load messages.');
                }
            })
            .catch(function (err) {
                console.error('Fetch error:', err);
                showError('Could not connect to Google Sheets. Check your internet connection.');
            });
    }

    function showError(msg) {
        $('#messagesContainer').html(
            '<div class="empty-state">' +
            '<i class="fa-solid fa-triangle-exclamation"></i>' +
            '<h3>Connection Error</h3>' +
            '<p>' + escapeHtml(msg) + '</p>' +
            '<button class="md-action primary" onclick="location.reload()" style="margin-top:1.6rem;">' +
            '<i class="fa-solid fa-arrows-rotate"></i> Try Again</button>' +
            '</div>'
        );
    }

    // ===== Stats =====

    function updateStats() {
        var total = allMessages.length;
        var unread = allMessages.filter(function (m) { return m.status !== 'read'; }).length;
        var read = total - unread;
        var today = allMessages.filter(function (m) { return isToday(m.timestamp); }).length;

        $('#totalCount').text(total);
        $('#unreadCount').text(unread);
        $('#readCount').text(read);
        $('#todayCount').text(today);
        $('#unreadBadge').text(unread).toggle(unread > 0);
    }

    // ===== Render Messages =====

    function renderMessages() {
        var filtered = allMessages.filter(function (msg) {
            // Status filter
            if (currentFilter === 'unread' && msg.status === 'read') return false;
            if (currentFilter === 'read' && msg.status !== 'read') return false;

            // Search filter
            if (currentSearch) {
                var search = currentSearch.toLowerCase();
                var match =
                    (msg.name || '').toLowerCase().indexOf(search) > -1 ||
                    (msg.email || '').toLowerCase().indexOf(search) > -1 ||
                    (msg.message || '').toLowerCase().indexOf(search) > -1 ||
                    (msg.projectType || '').toLowerCase().indexOf(search) > -1;
                if (!match) return false;
            }

            return true;
        });

        var $container = $('#messagesContainer');

        if (filtered.length === 0) {
            $container.html(
                '<div class="empty-state">' +
                '<i class="fa-solid fa-inbox"></i>' +
                '<h3>No messages found</h3>' +
                '<p>' + (allMessages.length === 0
                    ? 'No messages yet. They will appear here when someone fills your contact form.'
                    : 'Try adjusting your search or filters.') +
                '</p>' +
                '</div>'
            );
            return;
        }

        var html = filtered.map(function (msg) {
            var isUnread = msg.status !== 'read';
            var initials = getInitials(msg.name);
            var preview = (msg.message || '').substring(0, 150);

            return (
                '<div class="message-card ' + (isUnread ? 'unread' : '') + '" data-id="' + msg.id + '">' +
                    '<div class="msg-avatar">' + escapeHtml(initials) + '</div>' +
                    '<div class="msg-body">' +
                        '<div class="msg-head">' +
                            '<span class="msg-name">' + escapeHtml(msg.name || 'Anonymous') + '</span>' +
                            '<span class="msg-email">' + escapeHtml(msg.email || '') + '</span>' +
                        '</div>' +
                        '<div class="msg-preview">' + escapeHtml(preview) + (msg.message && msg.message.length > 150 ? '…' : '') + '</div>' +
                    '</div>' +
                    '<div class="msg-meta">' +
                        '<div class="msg-time">' + escapeHtml(formatTime(msg.timestamp)) + '</div>' +
                        (msg.projectType ? '<span class="msg-tag">' + escapeHtml(msg.projectType) + '</span>' : '') +
                    '</div>' +
                '</div>'
            );
        }).join('');

        $container.html(html);

        // Bind click handlers
        $('.message-card').on('click', function () {
            var id = $(this).data('id');
            openMessage(id);
        });
    }

    // ===== Open Message Detail =====

    function openMessage(id) {
        var msg = allMessages.find(function (m) { return m.id === id; });
        if (!msg) return;

        var initials = getInitials(msg.name);
        var emailHref = 'mailto:' + encodeURIComponent(msg.email || '') +
                       '?subject=' + encodeURIComponent('Re: Your message from portfolio');
        var waHref = msg.phone
            ? 'https://wa.me/' + (msg.phone.replace(/[^0-9]/g, '') || '')
            : '#';

        var html =
            '<div class="md-head">' +
                '<div class="md-avatar">' + escapeHtml(initials) + '</div>' +
                '<div class="md-info">' +
                    '<h2>' + escapeHtml(msg.name || 'Anonymous') + '</h2>' +
                    '<p>' + escapeHtml(msg.email || '') + '</p>' +
                '</div>' +
            '</div>' +

            (msg.phone ? '<div class="md-detail"><label>Phone</label><div class="value">' + escapeHtml(msg.phone) + '</div></div>' : '') +

            (msg.projectType ? '<div class="md-detail"><label>Project Type</label><div class="value">' + escapeHtml(msg.projectType) + '</div></div>' : '') +

            '<div class="md-detail"><label>Received</label><div class="value">' + escapeHtml(formatDateFull(msg.timestamp)) + '</div></div>' +

            '<div class="md-detail"><label>Message</label>' +
            '<div class="md-message">' + escapeHtml(msg.message || '') + '</div>' +
            '</div>' +

            '<div class="md-actions">' +
                '<a href="' + emailHref + '" class="md-action primary"><i class="fa-solid fa-reply"></i> Reply via Email</a>' +
                (msg.phone ? '<a href="' + waHref + '" target="_blank" class="md-action wa"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>' : '') +
                '<button class="md-action" data-action="mark-' + (msg.status === 'read' ? 'unread' : 'read') + '" data-id="' + msg.id + '">' +
                    '<i class="fa-solid fa-' + (msg.status === 'read' ? 'envelope' : 'envelope-open') + '"></i> ' +
                    'Mark as ' + (msg.status === 'read' ? 'Unread' : 'Read') +
                '</button>' +
                '<button class="md-action danger" data-action="delete" data-id="' + msg.id + '"><i class="fa-solid fa-trash"></i> Delete</button>' +
            '</div>';

        $('#modalBody').html(html);
        $('#messageModal').addClass('show');

        // Auto-mark as read on open (if unread)
        if (msg.status !== 'read') {
            updateStatus(id, 'read', false);
        }

        // Bind action handlers
        $('.md-action[data-action]').on('click', function () {
            var action = $(this).data('action');
            var msgId = $(this).data('id');

            if (action === 'mark-read') {
                updateStatus(msgId, 'read', true);
            } else if (action === 'mark-unread') {
                updateStatus(msgId, 'unread', true);
            } else if (action === 'delete') {
                if (confirm('Are you sure you want to delete this message?')) {
                    deleteMessage(msgId);
                }
            }
        });
    }

    // ===== Update Status =====

    function updateStatus(id, status, closeModal) {
        // Update locally first (optimistic UI)
        var msg = allMessages.find(function (m) { return m.id === id; });
        if (msg) msg.status = status;
        updateStats();
        renderMessages();

        if (closeModal) {
            setTimeout(function () { closeModalUI(); }, 300);
        }

        // Send to server
        var formData = new FormData();
        formData.append('action', 'updateStatus');
        formData.append('id', id);
        formData.append('status', status);
        formData.append('secret', SECRET_KEY);

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
            .catch(function (err) { console.error('Status update error:', err); });
    }

    function deleteMessage(id) {
        // Remove locally first
        allMessages = allMessages.filter(function (m) { return m.id !== id; });
        updateStats();
        renderMessages();
        closeModalUI();

        // Send to server
        var formData = new FormData();
        formData.append('action', 'updateStatus');
        formData.append('id', id);
        formData.append('status', 'delete');
        formData.append('secret', SECRET_KEY);

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
            .catch(function (err) { console.error('Delete error:', err); });
    }

    function closeModalUI() {
        $('#messageModal').removeClass('show');
    }

    // ===== INIT =====

    $(document).ready(function () {
        // Require login
        if (!HananAuth.requireAuth()) return;

        // Initial fetch
        fetchMessages(true);

        // Poll every 60 seconds
        pollTimer = setInterval(function () { fetchMessages(false); }, POLL_INTERVAL);

        // Refresh button
        $('#refreshBtn').on('click', function () {
            var $btn = $(this);
            $btn.prop('disabled', true);
            fetchMessages(true).finally(function () {
                setTimeout(function () { $btn.prop('disabled', false); }, 800);
            });
        });

        // Search
        var searchTimer;
        $('#searchInput').on('input', function () {
            var val = $(this).val();
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () {
                currentSearch = val;
                renderMessages();
            }, 200);
        });

        // Filter buttons
        $('.fb').on('click', function () {
            $('.fb').removeClass('active');
            $(this).addClass('active');
            currentFilter = $(this).data('filter');
            renderMessages();
        });

        // Modal close
        $('#messageModal').on('click', '[data-close]', closeModalUI);
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape') closeModalUI();
        });

        // Sidebar toggle (mobile)
        $('#sbToggle').on('click', function () {
            $('#sidebar').toggleClass('open');
        });

        // Logout
        $('#logoutBtn').on('click', function () {
            if (confirm('Are you sure you want to logout?')) {
                HananAuth.logout();
            }
        });
    });

})();
