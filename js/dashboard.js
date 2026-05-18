/* HANAN DASHBOARD - HOME (SUPER FAST) */
(function () {
    'use strict';
    var CACHE_KEY = 'hanan_dashboard_cache';
    var CACHE_DURATION = 5 * 60 * 1000;

    function getCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var c = JSON.parse(raw);
            if (Date.now() - c.timestamp > CACHE_DURATION) return null;
            return c.data;
        } catch (e) { return null; }
    }
    function setCache(d) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: d, timestamp: Date.now() })); } catch (e) {}
    }

    function updateClock() {
        var now = new Date();
        var h = now.getHours();
        var g = 'Welcome back', e = '👋';
        if (h < 12) { g = 'Good morning'; e = '☀️'; }
        else if (h < 17) { g = 'Good afternoon'; e = '🌤️'; }
        else if (h < 21) { g = 'Good evening'; e = '🌆'; }
        else { g = 'Good night'; e = '🌙'; }
        $('#greetingText').text(g);
        $('#greetingEmoji').text(e);
        $('#todayDate').text(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
        $('#currentTime').text(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
        var u = HananAuth.getCurrentUser();
        if (u) $('#welcomeName').text(u.charAt(0).toUpperCase() + u.slice(1));
    }

    function renderProjects(items) {
        $('#totalProjects').text(items.length);
        if (!items.length) {
            $('#recentProjects').html('<div class="overview-empty"><i class="fa-solid fa-folder-open"></i><p>No projects yet</p><a href="projects.html"><i class="fa-solid fa-plus"></i> Add First</a></div>');
            return;
        }
        var h = items.slice(0, 4).map(function (p) {
            return '<div class="overview-item"><div class="overview-item-icon" style="background:' + escapeHtml(p.color || '#f9ca24') + '22;color:' + escapeHtml(p.color || '#f9ca24') + ';"><i class="fa-solid fa-folder-open"></i></div><div class="overview-item-content"><div class="overview-item-title">' + escapeHtml(p.title) + '</div><div class="overview-item-meta">' + escapeHtml(p.category || 'Project') + '</div></div></div>';
        }).join('');
        $('#recentProjects').html(h);
    }

    function renderTestimonials(items) {
        $('#totalTestimonials').text(items.length);
        if (!items.length) {
            $('#recentTestimonials').html('<div class="overview-empty"><i class="fa-solid fa-star"></i><p>No reviews yet</p><a href="testimonials.html"><i class="fa-solid fa-plus"></i> Add First</a></div>');
            return;
        }
        var h = items.slice(0, 4).map(function (t) {
            var stars = '';
            for (var i = 0; i < 5; i++) stars += i < (parseInt(t.rating) || 5) ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
            return '<div class="overview-item"><div class="overview-item-icon"><i class="fa-solid fa-quote-left"></i></div><div class="overview-item-content"><div class="overview-item-title">' + escapeHtml(t.name) + '</div><div class="overview-stars">' + stars + '</div></div></div>';
        }).join('');
        $('#recentTestimonials').html(h);
    }

    function renderSkills(items) {
        $('#totalSkills').text(items.length);
        if (!items.length) {
            $('#topSkills').html('<div class="overview-empty"><i class="fa-solid fa-code"></i><p>No skills yet</p><a href="skills.html"><i class="fa-solid fa-plus"></i> Add First</a></div>');
            return;
        }
        var sorted = items.slice().sort(function (a, b) { return (parseInt(b.percent) || 0) - (parseInt(a.percent) || 0); }).slice(0, 4);
        var h = sorted.map(function (s) {
            var p = parseInt(s.percent) || 0;
            var ic = (s.icon || 'fa-code').indexOf('fa-') === 0 ? 'fa-solid ' + s.icon : s.icon;
            return '<div class="overview-item"><div class="overview-item-icon" style="background:' + escapeHtml(s.color || '#f9ca24') + '22;color:' + escapeHtml(s.color || '#f9ca24') + ';"><i class="' + ic + '"></i></div><div class="overview-item-content"><div class="overview-item-title">' + escapeHtml(s.name) + ' (' + p + '%)</div><div class="overview-item-progress"><div class="overview-item-progress-fill" style="width:' + p + '%;background:' + escapeHtml(s.color || '#f9ca24') + ';"></div></div></div></div>';
        }).join('');
        $('#topSkills').html(h);
    }

    function renderUpdates(items) {
        $('#totalUpdates').text(items.length);
        if (!items.length) {
            $('#recentUpdates').html('<div class="overview-empty"><i class="fa-solid fa-bullhorn"></i><p>No updates yet</p><a href="whatsnew.html"><i class="fa-solid fa-plus"></i> Add First</a></div>');
            return;
        }
        var sorted = items.slice().sort(function (a, b) { return new Date(b.date || 0) - new Date(a.date || 0); }).slice(0, 4);
        var h = sorted.map(function (u) {
            return '<div class="overview-item"><div class="overview-item-icon"><i class="fa-solid fa-bullhorn"></i></div><div class="overview-item-content"><div class="overview-item-title">' + escapeHtml(u.title) + '</div><div class="overview-item-meta">' + escapeHtml(u.tag || 'UPDATE') + ' · ' + timeAgo(u.date) + '</div></div></div>';
        }).join('');
        $('#recentUpdates').html(h);
    }

    function renderSiteInfo(s) {
        if (!s || Object.keys(s).length === 0) {
            $('#siteInfoGrid').html('<div class="overview-empty" style="grid-column:1/-1;"><i class="fa-solid fa-id-card"></i><p>No website info set yet</p><a href="website-editor.html"><i class="fa-solid fa-pen-to-square"></i> Edit Website Info</a></div>');
            return;
        }
        var av = s.contact_availability || 'available';
        var avLabel = av === 'available' ? 'Available for Work' : av === 'busy' ? 'Currently Busy' : 'Not Available';
        var h = '';
        if (s.hero_name) h += '<div class="site-info-item"><div class="site-info-item-label"><i class="fa-solid fa-user"></i> Name</div><div class="site-info-item-value">' + escapeHtml(s.hero_name) + '</div></div>';
        if (s.hero_tagline) h += '<div class="site-info-item"><div class="site-info-item-label"><i class="fa-solid fa-quote-left"></i> Tagline</div><div class="site-info-item-value">' + escapeHtml(s.hero_tagline) + '</div></div>';
        if (s.contact_email) h += '<div class="site-info-item"><div class="site-info-item-label"><i class="fa-solid fa-envelope"></i> Email</div><div class="site-info-item-value">' + escapeHtml(s.contact_email) + '</div></div>';
        if (s.contact_whatsapp) h += '<div class="site-info-item"><div class="site-info-item-label"><i class="fa-brands fa-whatsapp"></i> WhatsApp</div><div class="site-info-item-value">+' + escapeHtml(s.contact_whatsapp) + '</div></div>';
        if (s.contact_location) h += '<div class="site-info-item"><div class="site-info-item-label"><i class="fa-solid fa-location-dot"></i> Location</div><div class="site-info-item-value">' + escapeHtml(s.contact_location) + '</div></div>';
        h += '<div class="site-info-item"><div class="site-info-item-label"><i class="fa-solid fa-circle"></i> Availability</div><div class="site-info-item-value"><span class="availability-badge ' + av + '"><span class="dot"></span>' + avLabel + '</span></div></div>';
        $('#siteInfoGrid').html(h);
    }

    function renderMessages(items) {
        $('#totalMessages').text(items.length);
        var unread = items.filter(function (m) { return m.status === 'unread'; }).length;
        $('#unreadMessages').text(unread);
        if (unread > 0) $('#unreadBadge').text(unread).show();
    }

    function renderAll(data) {
        renderMessages(data.messages || []);
        renderProjects(data.projects || []);
        renderTestimonials(data.testimonials || []);
        renderSkills(data.skills || []);
        renderUpdates(data.whatsnew || data.updates || []);
        renderSiteInfo(data.settings || {});
    }

    function fetchFresh(silent) {
        var t0 = Date.now();
        var allP = fetch(HananAuth.getApiUrl() + '?action=getAllData').then(function (r) { return r.json(); }).catch(function () { return null; });
        var msgP = fetch(HananAuth.getApiUrl() + '?action=getMessages').then(function (r) { return r.json(); }).catch(function () { return { messages: [] }; });
        Promise.all([allP, msgP]).then(function (results) {
            var a = results[0] || {};
            var m = results[1] || {};
            var data = {
                messages: m.messages || [],
                projects: a.projects || [],
                testimonials: a.testimonials || [],
                skills: a.skills || [],
                whatsnew: a.whatsnew || a.updates || [],
                settings: a.settings || {}
            };
            setCache(data);
            renderAll(data);
            if (!silent) {
                var t = ((Date.now() - t0) / 1000).toFixed(1);
                notify({ message: 'Refreshed in ' + t + 's', type: 'success' });
            }
        });
    }

    $(function () {
        if (!HananAuth.requireAuth()) return;
        updateClock();
        setInterval(updateClock, 1000);

        var cached = getCache();
        if (cached) {
            renderAll(cached);
            setTimeout(function () { fetchFresh(true); }, 1000);
        } else {
            fetchFresh(false);
        }

        $('#refreshBtn').on('click', function () {
            var $b = $(this);
            $b.find('i').addClass('fa-spin');
            try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
            fetchFresh(false);
            setTimeout(function () { $b.find('i').removeClass('fa-spin'); }, 1500);
        });
    });
})();
