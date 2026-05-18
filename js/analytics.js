/* ANALYTICS PAGE */
(function () {
    'use strict';
    var allVisits = [];
    var period = 'today';

    function load() {
        fetch(HananAuth.getApiUrl() + '?action=getAnalytics')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                allVisits = (res && res.visits) || [];
                render();
            });
    }

    function getFiltered() {
        if (period === 'all') return allVisits;
        var now = new Date();
        var cutoff;
        if (period === 'today') cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        else if (period === '7d') cutoff = new Date(now.getTime() - 7 * 86400000);
        else cutoff = new Date(now.getTime() - 30 * 86400000);
        return allVisits.filter(function (v) { return new Date(v.timestamp) >= cutoff; });
    }

    function topN(arr, key, n) {
        var counts = {};
        arr.forEach(function (v) {
            var k = v[key] || 'unknown';
            counts[k] = (counts[k] || 0) + 1;
        });
        return Object.keys(counts).map(function (k) { return { name: k, count: counts[k] }; })
            .sort(function (a, b) { return b.count - a.count; }).slice(0, n || 5);
    }

    function renderList(id, items) {
        if (!items.length) { $('#' + id).html('<div class="empty-state-mini"><p>No data</p></div>'); return; }
        var h = items.map(function (i) {
            return '<div class="bd-item"><span class="bd-name">' + escapeHtml(i.name) + '</span><span class="bd-count">' + i.count + '</span></div>';
        }).join('');
        $('#' + id).html(h);
    }

    function render() {
        var filtered = getFiltered();
        var uniqueSessions = {};
        filtered.forEach(function (v) { if (v.session) uniqueSessions[v.session] = true; });

        $('#totalVisits').text(filtered.length);
        $('#uniqueVisitors').text(Object.keys(uniqueSessions).length);
        $('#periodLabel').text(period === 'today' ? 'Today' : period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : 'All time');

        var devices = topN(filtered, 'device');
        var browsers = topN(filtered, 'browser');
        var countries = topN(filtered, 'country');
        var referrers = topN(filtered, 'referrer');

        $('#topDevice').text(devices[0] ? devices[0].name : '—');
        $('#topCountry').text(countries[0] ? countries[0].name : '—');

        renderList('deviceList', devices);
        renderList('browserList', browsers);
        renderList('countryList', countries);
        renderList('referrerList', referrers);

        if (filtered.length === 0) {
            $('#visitsTableBody').html('<tr><td colspan="5"><div class="empty-state-mini"><i class="fa-solid fa-chart-line"></i><p>No visits in this period</p></div></td></tr>');
            return;
        }

        var rows = filtered.slice(0, 30).map(function (v) {
            return '<tr><td>' + timeAgo(v.timestamp) + '</td><td>' + escapeHtml(v.page || '/') + '</td><td>' + escapeHtml(v.device || '—') + '</td><td>' + escapeHtml(v.browser || '—') + '</td><td>' + escapeHtml(v.country || '—') + '</td></tr>';
        }).join('');
        $('#visitsTableBody').html(rows);
    }

    $(function () {
        if (!HananAuth.requireAuth()) return;
        load();
        $('#refreshBtn').on('click', load);
        $('.filter-bar').on('click', '.filter-btn', function () {
            $('.filter-bar .filter-btn').removeClass('active');
            $(this).addClass('active');
            period = $(this).data('period');
            render();
        });
    });
})();
