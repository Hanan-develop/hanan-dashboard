/* =========================================================
   DASHBOARD HOME - Enhanced with Caching + Live Data
   Loads from cache instantly, then refreshes in background
   ========================================================= */

(function () {
    'use strict';

    var GOOGLE_SCRIPT_URL = HananAuth.getApiUrl();
    var CACHE_KEY = 'hanan_dashboard_cache';
    var CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // ===== CACHE HELPERS =====

    function getCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var cache = JSON.parse(raw);
            var age = Date.now() - (cache.timestamp || 0);
            if (age > CACHE_DURATION) return null; // Cache expired
            return cache.data;
        } catch (e) {
            return null;
        }
    }

    function setCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Cache write failed:', e);
        }
    }

    // ===== HELPERS =====

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function timeAgo(dateStr) {
        if (!dateStr) return '—';
        var d = new Date(dateStr);
        var diff = (Date.now() - d.getTime()) / 1000;
        if (diff < 60) return 'just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function getInitials(name) {
        if (!name) return '?';
        var parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    // ===== UPDATE GREETING =====

    function updateGreeting() {
        var hour = new Date().getHours();
        var greeting = 'Welcome back';
        var emoji = '👋';

        if (hour < 12) { greeting = 'Good morning'; emoji = '☀️'; }
        else if (hour < 17) { greeting = 'Good afternoon'; emoji = '🌤️'; }
        else if (hour < 21) { greeting = 'Good evening'; emoji = '🌆'; }
        else { greeting = 'Good night'; emoji = '🌙'; }

        $('#greetingText').text(greeting);
        $('#greetingEmoji').text(emoji);

        // Update name
        var user = HananAuth.getCurrentUser();
        if (user) {
            var name = user.charAt(0).toUpperCase() + user.slice(1);
            $('#welcomeName').text(name);
            $('#sbUserName').text(name);
        }
    }

    function updateClock() {
        var now = new Date();
        var date = now.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
        var time = now.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
        });
        $('#todayDate').text(date);
        $('#currentTime').text(time);
    }

    // ===== RENDER FUNCTIONS =====

    function renderMessageStats(messages) {
        var now = new Date();
        var today = now.toDateString();
        var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        var unread = messages.filter(function (m) { return m.status === 'unread'; }).length;
        var todayCount = messages.filter(function (m) {
            return m.timestamp && new Date(m.timestamp).toDateString() === today;
        }).length;
        var weekCount = messages.filter(function (m) {
            return m.timestamp && new Date(m.timestamp) >= weekAgo;
        }).length;

        $('#totalMessages').text(messages.length);
        $('#unreadMessages').text(unread);

        // Update unread badge in sidebar
        if (unread > 0) {
            $('#unreadBadge').text(unread).show();
        } else {
            $('#unreadBadge').hide();
        }

        // Render bar chart (last 7 days)
        var chartData = {};
        for (var i = 6; i >= 0; i--) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            var key = d.toLocaleDateString('en-US', { weekday: 'short' });
            chartData[key] = 0;
        }

        messages.forEach(function (m) {
            if (!m.timestamp) return;
            var d = new Date(m.timestamp);
            if (d >= weekAgo) {
                var key = d.toLocaleDateString('en-US', { weekday: 'short' });
                if (chartData[key] !== undefined) chartData[key]++;
            }
        });

        var maxValue = Math.max.apply(null, Object.values(chartData)) || 1;
        var barHtml = '';
        Object.keys(chartData).forEach(function (day) {
            var val = chartData[day];
            var height = (val / maxValue) * 100;
            barHtml += '<div class="bar-col">' +
                '<div class="bar-value">' + val + '</div>' +
                '<div class="bar" style="height: ' + height + '%;"></div>' +
                '<div class="bar-label">' + day + '</div>' +
            '</div>';
        });
        $('#barChart').html(barHtml);
        $('#chartNote').text('Showing message activity for the last 7 days');

        // Recent messages list (top 5)
        var recent = messages.slice(0, 5);
        if (recent.length === 0) {
            $('#recentList').html('<div class="empty-state-mini"><i class="fa-solid fa-inbox"></i><p>No messages yet</p></div>');
        } else {
            var html = recent.map(function (m) {
                var initials = getInitials(m.name);
                var unreadClass = m.status === 'unread' ? ' unread' : '';
                return '<a href="messages.html" class="recent-item' + unreadClass + '">' +
                    '<div class="recent-avatar">' + escapeHtml(initials) + '</div>' +
                    '<div class="recent-content">' +
                        '<div class="recent-name">' + escapeHtml(m.name) + '</div>' +
                        '<div class="recent-preview">' + escapeHtml((m.message || '').substring(0, 60)) + '...</div>' +
                    '</div>' +
                    '<div class="recent-time">' + timeAgo(m.timestamp) + '</div>' +
                '</a>';
            }).join('');
            $('#recentList').html(html);
        }
    }

    function renderRecentProjects(projects) {
        $('#totalProjects').text(projects.length);

        var recent = projects.slice(0, 4);
        if (recent.length === 0) {
            $('#recentProjects').html(
                '<div class="overview-empty">' +
                '<i class="fa-solid fa-folder-open"></i>' +
                '<p>No projects yet</p>' +
                '<a href="projects.html"><i class="fa-solid fa-plus"></i> Add First Project</a>' +
                '</div>'
            );
            return;
        }

        var html = recent.map(function (p) {
            return '<div class="overview-item">' +
                '<div class="overview-item-icon" style="background: ' + escapeHtml(p.color || '#f9ca24') + '22; color: ' + escapeHtml(p.color || '#f9ca24') + ';">' +
                    '<i class="fa-solid fa-folder-open"></i>' +
                '</div>' +
                '<div class="overview-item-content">' +
                    '<div class="overview-item-title">' + escapeHtml(p.title) + '</div>' +
                    '<div class="overview-item-meta">' + escapeHtml(p.category || 'Project') + '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        $('#recentProjects').html(html);
    }

    function renderRecentTestimonials(testimonials) {
        $('#totalTestimonials').text(testimonials.length);

        var recent = testimonials.slice(0, 4);
        if (recent.length === 0) {
            $('#recentTestimonials').html(
                '<div class="overview-empty">' +
                '<i class="fa-solid fa-star"></i>' +
                '<p>No reviews yet</p>' +
                '<a href="testimonials.html"><i class="fa-solid fa-plus"></i> Add First Review</a>' +
                '</div>'
            );
            return;
        }

        var html = recent.map(function (t) {
            var stars = '';
            for (var i = 0; i < 5; i++) {
                stars += i < (parseInt(t.rating) || 5)
                    ? '<i class="fa-solid fa-star"></i>'
                    : '<i class="fa-regular fa-star"></i>';
            }

            return '<div class="overview-item">' +
                '<div class="overview-item-icon"><i class="fa-solid fa-quote-left"></i></div>' +
                '<div class="overview-item-content">' +
                    '<div class="overview-item-title">' + escapeHtml(t.name) + '</div>' +
                    '<div class="overview-stars">' + stars + '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        $('#recentTestimonials').html(html);
    }

    function renderTopSkills(skills) {
        $('#totalSkills').text(skills.length);

        // Sort by percent desc
        var sorted = skills.slice().sort(function (a, b) {
            return (parseInt(b.percent) || 0) - (parseInt(a.percent) || 0);
        }).slice(0, 4);

        if (sorted.length === 0) {
            $('#topSkills').html(
                '<div class="overview-empty">' +
                '<i class="fa-solid fa-code"></i>' +
                '<p>No skills yet</p>' +
                '<a href="skills.html"><i class="fa-solid fa-plus"></i> Add First Skill</a>' +
                '</div>'
            );
            return;
        }

        var html = sorted.map(function (s) {
            var percent = parseInt(s.percent) || 0;
            var iconClass = (s.icon || 'fa-code').indexOf('fa-') === 0 ? 'fa-solid ' + s.icon : s.icon;
            return '<div class="overview-item">' +
                '<div class="overview-item-icon" style="background: ' + escapeHtml(s.color || '#f9ca24') + '22; color: ' + escapeHtml(s.color || '#f9ca24') + ';">' +
                    '<i class="' + iconClass + '"></i>' +
                '</div>' +
                '<div class="overview-item-content">' +
                    '<div class="overview-item-title">' + escapeHtml(s.name) + ' (' + percent + '%)</div>' +
                    '<div class="overview-item-progress">' +
                        '<div class="overview-item-progress-fill" style="width: ' + percent + '%; background: ' + escapeHtml(s.color || '#f9ca24') + ';"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        $('#topSkills').html(html);
    }

    function renderRecentUpdates(updates) {
        $('#totalUpdates').text(updates.length);

        // Sort by date desc
        var sorted = updates.slice().sort(function (a, b) {
            return new Date(b.date || 0) - new Date(a.date || 0);
        }).slice(0, 4);

        if (sorted.length === 0) {
            $('#recentUpdates').html(
                '<div class="overview-empty">' +
                '<i class="fa-solid fa-bullhorn"></i>' +
                '<p>No updates yet</p>' +
                '<a href="whatsnew.html"><i class="fa-solid fa-plus"></i> Add First Update</a>' +
                '</div>'
            );
            return;
        }

        var html = sorted.map(function (u) {
            return '<div class="overview-item">' +
                '<div class="overview-item-icon"><i class="fa-solid fa-bullhorn"></i></div>' +
                '<div class="overview-item-content">' +
                    '<div class="overview-item-title">' + escapeHtml(u.title) + '</div>' +
                    '<div class="overview-item-meta">' + escapeHtml(u.tag || 'UPDATE') + ' · ' + timeAgo(u.date) + '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        $('#recentUpdates').html(html);
    }

    function renderSiteInfo(settings) {
        if (!settings || Object.keys(settings).length === 0) {
            $('#siteInfoGrid').html(
                '<div class="overview-empty" style="grid-column: 1/-1;">' +
                '<i class="fa-solid fa-id-card"></i>' +
                '<p>No website info set yet</p>' +
                '<a href="website-editor.html"><i class="fa-solid fa-pen-to-square"></i> Edit Website Info</a>' +
                '</div>'
            );
            return;
        }

        var availability = settings.contact_availability || 'available';
        var availLabel = availability === 'available' ? 'Available for Work' :
                        availability === 'busy' ? 'Currently Busy' : 'Not Available';

        var html = '';

        if (settings.hero_name) {
            html += '<div class="site-info-item">' +
                '<div class="site-info-item-label"><i class="fa-solid fa-user"></i> Name</div>' +
                '<div class="site-info-item-value">' + escapeHtml(settings.hero_name) + '</div>' +
            '</div>';
        }

        if (settings.hero_tagline) {
            html += '<div class="site-info-item">' +
                '<div class="site-info-item-label"><i class="fa-solid fa-quote-left"></i> Tagline</div>' +
                '<div class="site-info-item-value">' + escapeHtml(settings.hero_tagline) + '</div>' +
            '</div>';
        }

        if (settings.contact_email) {
            html += '<div class="site-info-item">' +
                '<div class="site-info-item-label"><i class="fa-solid fa-envelope"></i> Email</div>' +
                '<div class="site-info-item-value">' + escapeHtml(settings.contact_email) + '</div>' +
            '</div>';
        }

        if (settings.contact_whatsapp) {
            html += '<div class="site-info-item">' +
                '<div class="site-info-item-label"><i class="fa-brands fa-whatsapp"></i> WhatsApp</div>' +
                '<div class="site-info-item-value">+' + escapeHtml(settings.contact_whatsapp) + '</div>' +
            '</div>';
        }

        if (settings.contact_location) {
            html += '<div class="site-info-item">' +
                '<div class="site-info-item-label"><i class="fa-solid fa-location-dot"></i> Location</div>' +
                '<div class="site-info-item-value">' + escapeHtml(settings.contact_location) + '</div>' +
            '</div>';
        }

        html += '<div class="site-info-item">' +
            '<div class="site-info-item-label"><i class="fa-solid fa-circle"></i> Availability</div>' +
            '<div class="site-info-item-value">' +
                '<span class="availability-badge ' + availability + '">' +
                    '<span class="dot"></span>' + availLabel +
                '</span>' +
            '</div>' +
        '</div>';

        $('#siteInfoGrid').html(html);
    }

    // ===== MAIN DATA LOAD =====

    function renderAllData(data) {
        renderMessageStats(data.messages || []);
        renderRecentProjects(data.projects || []);
        renderRecentTestimonials(data.testimonials || []);
        renderTopSkills(data.skills || []);
        renderRecentUpdates(data.whatsnew || []);
        renderSiteInfo(data.settings || {});

        $('#apiStatus').text('Connected & Live').css('color', 'var(--success)');
        $('#cacheStatus').text('Active (5min)').css('color', 'var(--success)');
    }

    function loadFromCache() {
        var cached = getCache();
        if (cached) {
            console.log('Loaded from cache');
            renderAllData(cached);
            return true;
        }
        return false;
    }

    function fetchFreshData(silent) {
        if (!silent) {
            console.log('Fetching fresh data...');
        }

        // Use Promise.all to fetch all data in parallel (FAST!)
        var promises = [
            fetch(GOOGLE_SCRIPT_URL + '?action=getMessages').then(function (r) { return r.json(); }).catch(function () { return { messages: [] }; }),
            fetch(GOOGLE_SCRIPT_URL + '?action=getProjects').then(function (r) { return r.json(); }).catch(function () { return { projects: [] }; }),
            fetch(GOOGLE_SCRIPT_URL + '?action=getTestimonials').then(function (r) { return r.json(); }).catch(function () { return { testimonials: [] }; }),
            fetch(GOOGLE_SCRIPT_URL + '?action=getSkills').then(function (r) { return r.json(); }).catch(function () { return { skills: [] }; }),
            fetch(GOOGLE_SCRIPT_URL + '?action=getWhatsNew').then(function (r) { return r.json(); }).catch(function () { return { updates: [] }; }),
            fetch(GOOGLE_SCRIPT_URL + '?action=getSiteSettings').then(function (r) { return r.json(); }).catch(function () { return { settings: {} }; })
        ];

        Promise.all(promises).then(function (results) {
            var data = {
                messages: (results[0] && results[0].messages) || [],
                projects: (results[1] && results[1].projects) || [],
                testimonials: (results[2] && results[2].testimonials) || [],
                skills: (results[3] && results[3].skills) || [],
                whatsnew: (results[4] && results[4].updates) || [],
                settings: (results[5] && results[5].settings) || {}
            };

            setCache(data);
            renderAllData(data);

            if (!silent) {
                console.log('Fresh data loaded and cached');
            }
        }).catch(function (err) {
            console.error('Fetch error:', err);
            $('#apiStatus').text('Connection Error').css('color', 'var(--error)');
        });
    }

    // ===== INIT =====
    $(document).ready(function () {
        if (!HananAuth.requireAuth()) return;

        updateGreeting();
        updateClock();
        setInterval(updateClock, 1000);

        // STRATEGY: Load cache first (instant), then fetch fresh in background
        var hasCachedData = loadFromCache();

        if (hasCachedData) {
            // Show cache, refresh silently in background
            setTimeout(function () { fetchFreshData(true); }, 500);
        } else {
            // No cache, fetch fresh now
            fetchFreshData(false);
        }

        // Manual refresh button
        $('#refreshBtn').on('click', function () {
            var $btn = $(this);
            $btn.prop('disabled', true).find('i').addClass('fa-spin');

            // Clear cache + fetch fresh
            try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
            fetchFreshData(false);

            setTimeout(function () {
                $btn.prop('disabled', false).find('i').removeClass('fa-spin');
                if (window.notify) {
                    notify({ message: 'Data refreshed!', type: 'success' });
                }
            }, 1500);
        });

        // Sidebar toggle (mobile)
        $('#sbToggle').on('click', function () {
            $('#sidebar').toggleClass('open');
        });

        // Logout
        $('#logoutBtn').on('click', function () {
            if (confirm('Logout?')) HananAuth.logout();
        });
    });

})();
