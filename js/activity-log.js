/* ACTIVITY LOG PAGE */
(function () {
    'use strict';
    var allActivity = [];
    var filter = 'all';
    var searchQuery = '';

    function getActionConfig(action) {
        var configs = {
            created: { color: 'success', icon: 'fa-plus', label: 'Created' },
            updated: { color: 'info', icon: 'fa-pen', label: 'Updated' },
            deleted: { color: 'error', icon: 'fa-trash', label: 'Deleted' },
            reorder: { color: 'warning', icon: 'fa-arrows-up-down', label: 'Reordered' },
            received: { color: 'info', icon: 'fa-envelope', label: 'Received' },
            login: { color: 'success', icon: 'fa-right-to-bracket', label: 'Login' },
            changed: { color: 'warning', icon: 'fa-key', label: 'Changed' }
        };
        return configs[action] || { color: 'info', icon: 'fa-circle-info', label: action };
    }

    function getSectionIcon(section) {
        var icons = {
            'Projects': 'fa-folder-open',
            'Testimonials': 'fa-star',
            'Skills': 'fa-code',
            'Services': 'fa-briefcase',
            'Achievements': 'fa-trophy',
            'WhatsNew': 'fa-bullhorn',
            'Messages': 'fa-envelope',
            'Settings': 'fa-gear',
            'Sections': 'fa-eye',
            'Auth': 'fa-user',
            'Credentials': 'fa-key'
        };
        return icons[section] || 'fa-circle-info';
    }

    function load() {
        $('#activityList').html('<div class="loading-state"><div class="loader-spinner"></div><p>Loading activity...</p></div>');
        fetch(HananAuth.getApiUrl() + '?action=getActivityLog')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                allActivity = (res && res.activity) || [];
                render();
            })
            .catch(function () {
                $('#activityList').html('<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Connection Error</h3><p>Apps Script v8 deployed hai?</p></div>');
            });
    }

    function render() {
        var filtered = allActivity;
        if (filter !== 'all') filtered = filtered.filter(function (a) { return a.action === filter; });
        if (searchQuery) {
            filtered = filtered.filter(function (a) {
                return JSON.stringify(a).toLowerCase().indexOf(searchQuery) > -1;
            });
        }

        var counts = { created: 0, updated: 0, deleted: 0 };
        allActivity.forEach(function (a) {
            if (counts.hasOwnProperty(a.action)) counts[a.action]++;
        });
        $('#statTotal').text(allActivity.length);
        $('#statCreated').text(counts.created);
        $('#statUpdated').text(counts.updated);
        $('#statDeleted').text(counts.deleted);

        if (filtered.length === 0) {
            $('#activityList').html('<div class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><h3>No activity yet</h3><p>Activity will appear here as you make changes</p></div>');
            return;
        }

        var html = '<div class="activity-feed">' + filtered.map(function (a) {
            var cfg = getActionConfig(a.action);
            var sectionIcon = getSectionIcon(a.section);
            return '<div class="activity-item ' + cfg.color + '">' +
                '<div class="activity-icon"><i class="fa-solid ' + cfg.icon + '"></i></div>' +
                '<div class="activity-content">' +
                '<div class="activity-head">' +
                '<span class="activity-action">' + escapeHtml(cfg.label) + '</span>' +
                '<span class="activity-section"><i class="fa-solid ' + sectionIcon + '"></i> ' + escapeHtml(a.section) + '</span>' +
                '<span class="activity-time">' + timeAgo(a.timestamp) + '</span>' +
                '</div>' +
                '<div class="activity-title">' + escapeHtml(a.itemTitle || '(no title)') + '</div>' +
                (a.itemId ? '<div class="activity-id">ID: ' + escapeHtml(a.itemId) + '</div>' : '') +
                '</div></div>';
        }).join('') + '</div>';
        $('#activityList').html(html);

        if (searchQuery) {
            $('#searchResultCount').text(filtered.length + ' result' + (filtered.length !== 1 ? 's' : '')).show();
        } else {
            $('#searchResultCount').hide();
        }
    }

    function clearLog() {
        if (!confirm('Clear ALL activity log? This cannot be undone.')) return;
        var fd = new FormData();
        fd.append('action', 'clearActivityLog');
        fd.append('secret', HananAuth.getSecret());
        fetch(HananAuth.getApiUrl(), { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    notify({ message: 'Activity log cleared!', type: 'success' });
                    load();
                }
            });
    }

    $(function () {
        if (!HananAuth.requireAuth()) return;
        load();
        $('#refreshBtn').on('click', load);
        $('#clearLogBtn').on('click', clearLog);
        $('.filter-toolbar').on('click', '.filter-btn', function () {
            $('.filter-btn').removeClass('active');
            $(this).addClass('active');
            filter = $(this).data('filter');
            render();
        });
        $('#searchInput').on('input', function () { searchQuery = $(this).val().toLowerCase(); render(); });
    });
})();
