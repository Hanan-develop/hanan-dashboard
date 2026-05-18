/* =========================================================
   DASHBOARD HOME - LOGIC
   ========================================================= */

(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = HananAuth.getApiUrl();

    // ===== HELPERS =====

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

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function getGreeting() {
        var hour = new Date().getHours();
        if (hour < 12) return { text: 'Good morning', emoji: '🌅' };
        if (hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
        if (hour < 21) return { text: 'Good evening', emoji: '🌆' };
        return { text: 'Good night', emoji: '🌙' };
    }

    function updateDateTime() {
        var now = new Date();
        var dateStr = now.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        var timeStr = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        $('#todayDate').text(dateStr);
        $('#currentTime').text(timeStr);
    }

    function isToday(isoString) {
        if (!isoString) return false;
        var date = new Date(isoString);
        var now = new Date();
        return date.toDateString() === now.toDateString();
    }

    function isThisWeek(isoString) {
        if (!isoString) return false;
        var date = new Date(isoString);
        var now = new Date();
        var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
    }

    // Group messages by day for last 7 days
    function groupByDay(messages) {
        var days = [];
        var now = new Date();

        for (var i = 6; i >= 0; i--) {
            var day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            day.setHours(0, 0, 0, 0);
            var dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);

            var count = messages.filter(function (m) {
                if (!m.timestamp) return false;
                var d = new Date(m.timestamp);
                return d >= day && d < dayEnd;
            }).length;

            days.push({
                label: day.toLocaleDateString('en-US', { weekday: 'short' }),
                fullDate: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: count
            });
        }

        return days;
    }

    // Render bar chart
    function renderChart(days) {
        var maxCount = Math.max.apply(null, days.map(function (d) { return d.count; }));
        if (maxCount === 0) maxCount = 1; // Avoid divide by zero

        var html = days.map(function (day) {
            var heightPct = day.count > 0 ? Math.max((day.count / maxCount) * 100, 8) : 0;
            var emptyClass = day.count === 0 ? ' empty' : '';

            return (
                '<div class="bar-item" title="' + day.fullDate + ': ' + day.count + ' messages">' +
                    '<span class="bar-value">' + day.count + '</span>' +
                    '<div class="bar' + emptyClass + '" style="height: ' + heightPct + '%;"></div>' +
                    '<span class="bar-label">' + day.label + '</span>' +
                '</div>'
            );
        }).join('');

        $('#barChart').html(html);

        var totalWeek = days.reduce(function (sum, d) { return sum + d.count; }, 0);
        $('#chartNote').html(
            'Total this week: <strong style="color: var(--yellow);">' + totalWeek +
            '</strong> messages • Hover bars to see exact count'
        );
    }

    // Render recent messages
    function renderRecent(messages) {
        if (!messages || messages.length === 0) {
            $('#recentList').html(
                '<div class="empty-state">' +
                '<i class="fa-solid fa-inbox" style="font-size: 4rem; opacity: 0.3;"></i>' +
                '<h3 style="margin-top: 1rem;">No messages yet</h3>' +
                '<p>Messages will appear here when someone contacts you.</p>' +
                '</div>'
            );
            return;
        }

        var recent = messages.slice(0, 5);

        var html = recent.map(function (msg) {
            var isUnread = msg.status !== 'read';
            return (
                '<a href="messages.html" class="recent-item' + (isUnread ? ' unread' : '') + '">' +
                    '<div class="recent-avatar">' + escapeHtml(getInitials(msg.name)) + '</div>' +
                    '<div class="recent-content">' +
                        '<div class="recent-name">' + escapeHtml(msg.name || 'Anonymous') + '</div>' +
                        '<div class="recent-preview">' + escapeHtml((msg.message || '').substring(0, 80)) + '</div>' +
                    '</div>' +
                    '<div class="recent-time">' + formatTime(msg.timestamp) + '</div>' +
                '</a>'
            );
        }).join('');

        $('#recentList').html(html);
    }

    // Update stats
    function updateStats(messages) {
        var total = messages.length;
        var unread = messages.filter(function (m) { return m.status !== 'read'; }).length;
        var today = messages.filter(function (m) { return isToday(m.timestamp); }).length;
        var thisWeek = messages.filter(function (m) { return isThisWeek(m.timestamp); }).length;

        // Animate counters
        animateCounter('#totalMessages', total);
        animateCounter('#unreadMessages', unread);
        animateCounter('#todayMessages', today);
        animateCounter('#weekMessages', thisWeek);

        // Sidebar badge
        if (unread > 0) {
            $('#unreadBadge').text(unread).show();
        } else {
            $('#unreadBadge').hide();
        }
    }

    function animateCounter(selector, target) {
        var $el = $(selector);
        var start = parseInt($el.text()) || 0;
        var duration = 800;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
            var current = Math.floor(start + (target - start) * eased);
            $el.text(current);
            if (progress < 1) requestAnimationFrame(step);
            else $el.text(target);
        }
        requestAnimationFrame(step);
    }

    // Fetch all dashboard data
    var lastMessageCount = 0;
    var isFirstFetch = true;

    function fetchDashboardData() {
        fetch(GOOGLE_SCRIPT_URL)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok) {
                    var messages = data.messages || [];

                    // Detect new messages (not on first load)
                    if (!isFirstFetch && messages.length > lastMessageCount) {
                        var newCount = messages.length - lastMessageCount;
                        var latestMsg = messages[0];

                        if (window.notify) {
                            notify({
                                title: 'New Message!',
                                message: 'From ' + (latestMsg.name || 'Anonymous') + (newCount > 1 ? ' (+' + (newCount - 1) + ' more)' : ''),
                                type: 'info',
                                persist: true,
                                duration: 6000
                            });
                        }

                        // Play subtle sound (browser allows for user-initiated context)
                        try {
                            // Visual flash on stat card
                            $('#totalMessages').closest('.stat-card').css('animation', 'pulse 0.6s ease-out');
                            setTimeout(function () {
                                $('#totalMessages').closest('.stat-card').css('animation', '');
                            }, 600);
                        } catch (e) { }
                    }

                    lastMessageCount = messages.length;
                    isFirstFetch = false;

                    updateStats(messages);
                    renderChart(groupByDay(messages));
                    renderRecent(messages);
                    $('#apiStatus').text('Connected (' + messages.length + ' records)');
                } else {
                    $('#apiStatus').text('Error: ' + (data.error || 'unknown'));
                    $('#apiStatus').closest('.health-item').find('.health-icon')
                        .removeClass('online').addClass('offline')
                        .html('<i class="fa-solid fa-xmark"></i>');
                }
            })
            .catch(function (err) {
                console.error('Dashboard fetch error:', err);
                $('#apiStatus').text('Connection failed');
                $('#apiStatus').closest('.health-item').find('.health-icon')
                    .removeClass('online').addClass('offline')
                    .html('<i class="fa-solid fa-xmark"></i>');
            });
    }

    // ===== INIT =====
    $(document).ready(function () {
        if (!HananAuth.requireAuth()) return;

        // Greeting
        var greeting = getGreeting();
        $('#greetingText').text(greeting.text);
        $('#greetingEmoji').text(greeting.emoji);

        // User name
        var user = HananAuth.getCurrentUser();
        if (user) {
            var displayName = user.charAt(0).toUpperCase() + user.slice(1);
            $('#welcomeName').text(displayName);
            $('#sbUserName').text(displayName);
        }

        // Date/time
        updateDateTime();
        setInterval(updateDateTime, 30000); // Update every 30 seconds

        // Fetch data
        fetchDashboardData();

        // Auto-refresh every 60 seconds
        setInterval(fetchDashboardData, 60000);

        // Refresh button
        $('#refreshBtn').on('click', function () {
            var $btn = $(this);
            $btn.prop('disabled', true);
            $btn.find('i').addClass('fa-spin');
            fetchDashboardData();
            setTimeout(function () {
                $btn.prop('disabled', false);
                $btn.find('i').removeClass('fa-spin');
            }, 1000);
        });

        // Sidebar toggle
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
