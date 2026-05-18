/* MESSAGES PAGE */
(function () {
    'use strict';
    var allMessages = [];
    var filter = 'all';
    var searchQ = '';

    function load() {
        $('#messagesList').html('<div class="loading-state"><div class="loader-spinner"></div><p>Loading messages...</p></div>');
        fetch(HananAuth.getApiUrl() + '?action=getMessages')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                allMessages = (res && res.messages) || [];
                render();
            })
            .catch(function () {
                $('#messagesList').html('<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Connection Error</h3></div>');
            });
    }

    function render() {
        var filtered = allMessages;
        if (filter !== 'all') filtered = allMessages.filter(function (m) { return m.status === filter; });
        if (searchQ) {
            var q = searchQ.toLowerCase();
            filtered = filtered.filter(function (m) {
                return (m.name || '').toLowerCase().indexOf(q) > -1 ||
                       (m.email || '').toLowerCase().indexOf(q) > -1 ||
                       (m.message || '').toLowerCase().indexOf(q) > -1;
            });
        }

        $('#countAll').text(allMessages.length);
        $('#countUnread').text(allMessages.filter(function (m) { return m.status === 'unread'; }).length);
        $('#countRead').text(allMessages.filter(function (m) { return m.status === 'read'; }).length);

        if (filtered.length === 0) {
            $('#messagesList').html('<div class="empty-state"><i class="fa-solid fa-inbox"></i><h3>No messages</h3><p>Messages from your contact form will appear here</p></div>');
            return;
        }

        var h = filtered.map(function (m) {
            return '<div class="message-item ' + (m.status === 'unread' ? 'unread' : '') + '">' +
                '<div class="msg-avatar">' + escapeHtml(getInitials(m.name)) + '</div>' +
                '<div class="msg-content">' +
                '<div class="msg-head"><span class="msg-name">' + escapeHtml(m.name) + '</span><span class="msg-time">' + timeAgo(m.timestamp) + '</span></div>' +
                '<div class="msg-email"><i class="fa-solid fa-envelope"></i> ' + escapeHtml(m.email) + (m.phone ? ' · <i class="fa-solid fa-phone"></i> ' + escapeHtml(m.phone) : '') + '</div>' +
                '<div class="msg-text">' + escapeHtml(m.message) + '</div>' +
                '<div class="msg-actions">' +
                (m.status === 'unread' ? '<button class="msg-btn" data-action="read" data-id="' + m.id + '"><i class="fa-solid fa-check"></i> Mark Read</button>' : '') +
                '<button class="msg-btn btn-delete" data-action="delete" data-id="' + m.id + '"><i class="fa-solid fa-trash"></i> Delete</button>' +
                '</div></div></div>';
        }).join('');
        $('#messagesList').html(h);
    }

    function updateStatus(id, status) {
        var fd = new FormData();
        fd.append('action', 'updateStatus');
        fd.append('secret', HananAuth.getSecret());
        fd.append('id', id);
        fd.append('status', status);
        fetch(HananAuth.getApiUrl(), { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    notify({ message: status === 'delete' ? 'Deleted!' : 'Marked as ' + status, type: 'success' });
                    load();
                }
            });
    }

    $(function () {
        if (!HananAuth.requireAuth()) return;
        load();
        $('#refreshBtn').on('click', load);
        $('.filter-bar').on('click', '.filter-btn', function () {
            $('.filter-bar .filter-btn').removeClass('active');
            $(this).addClass('active');
            filter = $(this).data('filter');
            render();
        });
        $('#searchInput').on('input', function () { searchQ = $(this).val(); render(); });
        $('#messagesList').on('click', '.msg-btn', function () {
            var a = $(this).data('action');
            var id = $(this).data('id');
            if (a === 'delete') { if (confirm('Delete this message?')) updateStatus(id, 'delete'); }
            else updateStatus(id, a);
        });
    });
})();
