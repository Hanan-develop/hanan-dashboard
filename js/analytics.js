/* =========================================================
   ANALYTICS PAGE - LOGIC
   ========================================================= */

(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = HananAuth.getApiUrl();
    var allVisits = [];
    var currentRange = 7;

    // ===== HELPERS =====

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function formatTime(isoString) {
        if (!isoString) return '—';
        var date = new Date(isoString);
        var now = new Date();
        var diffMins = Math.floor((now - date) / 60000);
        var diffHours = Math.floor((now - date) / 3600000);
        var diffDays = Math.floor((now - date) / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return diffMins + 'm ago';
        if (diffHours < 24) return diffHours + 'h ago';
        if (diffDays < 7) return diffDays + 'd ago';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function filterByRange(visits, days) {
        if (days === 'all') return visits;
        var cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return visits.filter(function (v) {
            if (!v.timestamp) return false;
            return new Date(v.timestamp) >= cutoff;
        });
    }

    function isToday(isoString) {
        if (!isoString) return false;
        var d = new Date(isoString);
        return d.toDateString() === new Date().toDateString();
    }

    function groupByCount(visits, field) {
        var counts = {};
        visits.forEach(function (v) {
            var key = v[field] || 'unknown';
            counts[key] = (counts[key] || 0) + 1;
        });

        var items = Object.keys(counts).map(function (k) {
            return { name: k, count: counts[k] };
        });

        items.sort(function (a, b) { return b.count - a.count; });
        return items;
    }

    function renderBreakdown(selector, items, total, icon) {
        var $list = $(selector);
        if (!items || items.length === 0) {
            $list.html('<div class="empty-mini">No data yet</div>');
            return;
        }

        var top = items.slice(0, 8);
        var html = top.map(function (item) {
            var pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
            return (
                '<div class="bd-item">' +
                    '<div class="bd-icon"><i class="' + icon + '"></i></div>' +
                    '<div class="bd-info">' +
                        '<div class="bd-name">' + escapeHtml(item.name) + '</div>' +
                        '<div class="bd-bar"><div class="bd-bar-fill" style="width: ' + pct + '%;"></div></div>' +
                    '</div>' +
                    '<div class="bd-count">' + item.count + '<span class="bd-pct">' + pct + '%</span></div>' +
                '</div>'
            );
        }).join('');

        $list.html(html);
    }

    // Group by day for chart
    function groupByDay(visits, days) {
        var result = [];
        var now = new Date();
        var daysCount = days === 'all' ? 30 : Math.min(days, 30);

        for (var i = daysCount - 1; i >= 0; i--) {
            var day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            day.setHours(0, 0, 0, 0);
            var dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);

            var count = visits.filter(function (v) {
                if (!v.timestamp) return false;
                var d = new Date(v.timestamp);
                return d >= day && d < dayEnd;
            }).length;

            result.push({
                label: daysCount <= 7
                    ? day.toLocaleDateString('en-US', { weekday: 'short' })
                    : (day.getDate() + ''),
                fullDate: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: count
            });
        }

        return result;
    }

    function renderChart(days) {
        var maxCount = Math.max.apply(null, days.map(function (d) { return d.count; }));
        if (maxCount === 0) maxCount = 1;

        var html = days.map(function (day) {
            var heightPct = day.count > 0 ? Math.max((day.count / maxCount) * 100, 8) : 0;
            var emptyClass = day.count === 0 ? ' empty' : '';
            return (
                '<div class="bar-item" title="' + day.fullDate + ': ' + day.count + ' visits">' +
                    '<span class="bar-value">' + day.count + '</span>' +
                    '<div class="bar' + emptyClass + '" style="height: ' + heightPct + '%;"></div>' +
                    '<span class="bar-label">' + day.label + '</span>' +
                '</div>'
            );
        }).join('');

        $('#visitorChart').html(html);

        var total = days.reduce(function (sum, d) { return sum + d.count; }, 0);
        $('#chartNote').html(
            'Total: <strong style="color: var(--yellow);">' + total + '</strong> visits • Hover bars for details'
        );
    }

    function renderRecentTable(visits) {
        var recent = visits.slice(0, 20);

        if (recent.length === 0) {
            $('#visitsTbody').html('<tr><td colspan="6" class="empty-mini">No visits yet. Visit your portfolio to test tracking!</td></tr>');
            $('#recentCount').text('0');
            return;
        }

        $('#recentCount').text(visits.length);

        var html = recent.map(function (v) {
            var deviceIcon = 'fa-desktop';
            if (v.device === 'mobile') deviceIcon = 'fa-mobile-screen';
            else if (v.device === 'tablet') deviceIcon = 'fa-tablet-screen-button';

            return (
                '<tr>' +
                    '<td>' + formatTime(v.timestamp) + '</td>' +
                    '<td>' + escapeHtml(v.page || '/') + '</td>' +
                    '<td><span class="device-pill"><i class="fa-solid ' + deviceIcon + '"></i> ' + escapeHtml(v.device || 'unknown') + '</span></td>' +
                    '<td>' + escapeHtml(v.browser || 'unknown') + '</td>' +
                    '<td><span class="country-pill"><i class="fa-solid fa-flag"></i> ' + escapeHtml(v.country || 'unknown') + '</span></td>' +
                    '<td>' + escapeHtml(v.referrer || 'direct') + '</td>' +
                '</tr>'
            );
        }).join('');

        $('#visitsTbody').html(html);
    }

    function animateCounter(selector, target) {
        var $el = $(selector);
        var start = parseInt($el.text()) || 0;
        var duration = 800;
        var startTime = null;
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.floor(start + (target - start) * eased);
            $el.text(current);
            if (progress < 1) requestAnimationFrame(step);
            else $el.text(target);
        }
        requestAnimationFrame(step);
    }

    function renderAnalytics() {
        var filtered = filterByRange(allVisits, currentRange);
        var total = filtered.length;

        // Stats
        var uniqueSessions = {};
        filtered.forEach(function (v) {
            if (v.session) uniqueSessions[v.session] = true;
        });
        var uniqueCount = Object.keys(uniqueSessions).length;

        var todayCount = filtered.filter(function (v) { return isToday(v.timestamp); }).length;

        var countriesSet = {};
        filtered.forEach(function (v) {
            if (v.country && v.country !== 'unknown') countriesSet[v.country] = true;
        });
        var countriesCount = Object.keys(countriesSet).length;

        animateCounter('#totalVisits', total);
        animateCounter('#uniqueVisitors', uniqueCount);
        animateCounter('#todayVisits', todayCount);
        animateCounter('#countriesCount', countriesCount);

        // Chart
        renderChart(groupByDay(filtered, currentRange));

        // Breakdowns
        renderBreakdown('#devicesList', groupByCount(filtered, 'device'), total, 'fa-solid fa-mobile-screen');
        renderBreakdown('#browsersList', groupByCount(filtered, 'browser'), total, 'fa-solid fa-window-maximize');
        renderBreakdown('#osList', groupByCount(filtered, 'os'), total, 'fa-solid fa-desktop');
        renderBreakdown('#countriesList', groupByCount(filtered, 'country'), total, 'fa-solid fa-flag');
        renderBreakdown('#pagesList', groupByCount(filtered, 'page'), total, 'fa-solid fa-file-lines');
        renderBreakdown('#referrersList', groupByCount(filtered, 'referrer'), total, 'fa-solid fa-link');

        // Recent
        renderRecentTable(filtered);
    }

    function fetchAnalytics() {
        $('#chartNote').text('Loading analytics data...');

        fetch(GOOGLE_SCRIPT_URL + '?action=getAnalytics')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok) {
                    allVisits = data.visits || [];
                    renderAnalytics();
                } else {
                    $('#chartNote').text('Error: ' + (data.error || 'unknown'));
                }
            })
            .catch(function (err) {
                console.error('Analytics fetch error:', err);
                $('#chartNote').text('Connection failed');
            });
    }

    // ===== INIT =====
    $(document).ready(function () {
        if (!HananAuth.requireAuth()) return;

        var user = HananAuth.getCurrentUser();
        if (user) {
            $('#sbUserName').text(user.charAt(0).toUpperCase() + user.slice(1));
        }

        fetchAnalytics();
        setInterval(fetchAnalytics, 60000);

        // Time range filter
        $('.tf').on('click', function () {
            $('.tf').removeClass('active');
            $(this).addClass('active');
            var range = $(this).data('range');
            currentRange = range === 'all' ? 'all' : parseInt(range);
            renderAnalytics();
        });

        // Refresh
        $('#refreshBtn').on('click', function () {
            var $btn = $(this);
            $btn.prop('disabled', true);
            $btn.find('i').addClass('fa-spin');
            fetchAnalytics();
            setTimeout(function () {
                $btn.prop('disabled', false);
                $btn.find('i').removeClass('fa-spin');
            }, 1000);
        });

        $('#sbToggle').on('click', function () {
            $('#sidebar').toggleClass('open');
        });

        $('#logoutBtn').on('click', function () {
            if (confirm('Logout?')) HananAuth.logout();
        });
    });

})();
