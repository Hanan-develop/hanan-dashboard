/* =========================================================
   HANAN PORTFOLIO - DYNAMIC DATA LOADER
   Auto-fetches data from Google Sheet
   Respects hide/show, section visibility, edits, deletes
   ========================================================= */

(function () {
    'use strict';

    var API_URL = 'https://script.google.com/macros/s/AKfycbx2sQwvMTOCeNdiE255oLaoqXUHvdsKrcn423nUIqrwqRtcWTdUL6LPm9VJjVz4M6dE/exec';
    var CACHE_KEY = 'hanan_portfolio_cache';
    var CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (shorter for portfolio)

    // ===== UTILITIES =====
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

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

    // ===== DEDUPLICATION (Frontend safety) =====
    function dedupe(items, nameField) {
        var seen = {};
        return items.filter(function (item) {
            var key = (item[nameField] || '').toLowerCase().trim();
            if (!key || seen[key]) return false;
            seen[key] = true;
            return true;
        });
    }

    // ===== SECTION VISIBILITY =====
    function applyVisibility(visibility) {
        if (!visibility) return;
        Object.keys(visibility).forEach(function (key) {
            // key like "section_hero", "section_services"
            var sectionId = key.replace('section_', '');
            var el = document.getElementById(sectionId) || document.querySelector('.' + sectionId);
            if (el) {
                if (visibility[key] === 'off') {
                    el.style.display = 'none';
                } else {
                    el.style.display = '';
                }
            }
        });
    }

    // ===== RENDER FUNCTIONS =====

    function renderProjects(projects) {
        var container = document.getElementById('projectsContainer') || document.querySelector('.projects-grid');
        if (!container) return;
        if (!projects || !projects.length) {
            container.innerHTML = '';
            return;
        }
        // Dedupe by title
        projects = dedupe(projects, 'title');

        var html = projects.map(function (p) {
            return '<div class="project-card" data-color="' + escapeHtml(p.color || '#f9ca24') + '" style="--card-color:' + escapeHtml(p.color || '#f9ca24') + ';">' +
                (p.imageUrl ? '<div class="project-image"><img src="' + escapeHtml(p.imageUrl) + '" alt="' + escapeHtml(p.title) + '" loading="lazy" /></div>' : '<div class="project-image placeholder"></div>') +
                '<div class="project-content">' +
                    '<span class="project-category">' + escapeHtml(p.category || 'Project') + '</span>' +
                    '<h3 class="project-title">' + escapeHtml(p.title) + '</h3>' +
                    '<p class="project-description">' + escapeHtml(p.description || '') + '</p>' +
                    (p.tech ? '<div class="project-tech">' + escapeHtml(p.tech).split(',').map(function (t) { return '<span>' + escapeHtml(t.trim()) + '</span>'; }).join('') + '</div>' : '') +
                    (p.liveUrl ? '<a href="' + escapeHtml(p.liveUrl) + '" target="_blank" class="project-link">View Live <i class="fa-solid fa-arrow-right"></i></a>' : '') +
                '</div>' +
            '</div>';
        }).join('');
        container.innerHTML = html;
    }

    function renderTestimonials(testimonials) {
        var container = document.getElementById('testimonialsContainer') || document.querySelector('.testimonials-grid');
        if (!container) return;
        if (!testimonials || !testimonials.length) {
            container.innerHTML = '';
            return;
        }
        // Dedupe by name + message
        testimonials = dedupe(testimonials, 'name');

        var html = testimonials.map(function (t) {
            var stars = '';
            for (var i = 0; i < 5; i++) stars += i < (parseInt(t.rating) || 5) ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
            var featured = (t.featured === true || t.featured === 'yes') ? ' featured' : '';
            var initials = (t.name || '?').split(' ').map(function (n) { return n.charAt(0); }).slice(0, 2).join('').toUpperCase();
            return '<div class="testimonial-card' + featured + '">' +
                '<div class="testimonial-stars">' + stars + '</div>' +
                '<p class="testimonial-text">"' + escapeHtml(t.message) + '"</p>' +
                '<div class="testimonial-author">' +
                    (t.avatar ? '<img src="' + escapeHtml(t.avatar) + '" alt="' + escapeHtml(t.name) + '" />' : '<div class="testimonial-avatar">' + initials + '</div>') +
                    '<div><h4>' + escapeHtml(t.name) + '</h4><p>' + escapeHtml(t.role || '') + (t.company ? ' · ' + escapeHtml(t.company) : '') + '</p></div>' +
                '</div>' +
            '</div>';
        }).join('');
        container.innerHTML = html;
    }

    function renderSkills(skills) {
        var container = document.getElementById('skillsContainer') || document.querySelector('.skills-grid');
        if (!container) return;
        if (!skills || !skills.length) {
            container.innerHTML = '';
            return;
        }
        skills = dedupe(skills, 'name');
        skills.sort(function (a, b) { return (parseInt(b.percent) || 0) - (parseInt(a.percent) || 0); });

        var html = skills.map(function (s) {
            var ic = (s.icon || 'fa-code').indexOf('fa-') === 0 ? (s.icon.indexOf('wordpress') !== -1 || s.icon.indexOf('shopify') !== -1 ? 'fa-brands ' + s.icon : 'fa-solid ' + s.icon) : s.icon;
            return '<div class="skill-card" style="--skill-color:' + escapeHtml(s.color || '#f9ca24') + ';">' +
                '<div class="skill-icon" style="background:' + escapeHtml(s.color || '#f9ca24') + '22;color:' + escapeHtml(s.color || '#f9ca24') + ';"><i class="' + ic + '"></i></div>' +
                '<div class="skill-content">' +
                    '<h3>' + escapeHtml(s.name) + '</h3>' +
                    '<p>' + escapeHtml(s.level || 'Intermediate') + '</p>' +
                    '<div class="skill-bar"><div class="skill-bar-fill" style="width:' + (parseInt(s.percent) || 50) + '%;background:' + escapeHtml(s.color || '#f9ca24') + ';"></div></div>' +
                    '<span class="skill-percent">' + (parseInt(s.percent) || 50) + '%</span>' +
                '</div>' +
            '</div>';
        }).join('');
        container.innerHTML = html;
    }

    function renderServices(services) {
        var container = document.getElementById('servicesContainer') || document.querySelector('.services-grid');
        if (!container) return;
        if (!services || !services.length) {
            container.innerHTML = '';
            return;
        }
        // Filter HIDDEN ones (respect dashboard hide)
        services = services.filter(function (s) { return s.visible !== 'no'; });
        services = dedupe(services, 'title');
        services.sort(function (a, b) { return (parseInt(a.orderNum) || 99) - (parseInt(b.orderNum) || 99); });

        var html = services.map(function (s) {
            var ic = (s.icon || 'fa-briefcase').indexOf('fa-') === 0 ? (s.icon.indexOf('wordpress') !== -1 || s.icon.indexOf('shopify') !== -1 ? 'fa-brands ' + s.icon : 'fa-solid ' + s.icon) : s.icon;
            var features = (s.features || '').split('\n').filter(function (f) { return f.trim(); });
            var tag = s.tag ? '<span class="service-tag">' + escapeHtml(s.tag.toUpperCase()) + '</span>' : '';
            return '<div class="service-card" style="--service-color:' + escapeHtml(s.color || '#f9ca24') + ';">' +
                tag +
                '<div class="service-icon" style="background:' + escapeHtml(s.color || '#f9ca24') + ';"><i class="' + ic + '"></i></div>' +
                '<h3>' + escapeHtml(s.title) + '</h3>' +
                '<p>' + escapeHtml(s.description) + '</p>' +
                (features.length ? '<ul>' + features.map(function (f) { return '<li><i class="fa-solid fa-check"></i> ' + escapeHtml(f) + '</li>'; }).join('') + '</ul>' : '') +
            '</div>';
        }).join('');
        container.innerHTML = html;
    }

    function renderAchievements(achievements) {
        var container = document.getElementById('achievementsContainer') || document.querySelector('.achievements-grid');
        if (!container) return;
        if (!achievements || !achievements.length) {
            container.innerHTML = '';
            return;
        }
        // Filter HIDDEN
        achievements = achievements.filter(function (a) { return a.visible !== 'no'; });
        achievements = dedupe(achievements, 'title');
        achievements.sort(function (a, b) { return (parseInt(a.orderNum) || 99) - (parseInt(b.orderNum) || 99); });

        var html = achievements.map(function (a) {
            var ic = (a.icon || 'fa-trophy').indexOf('fa-') === 0 ? 'fa-solid ' + a.icon : a.icon;
            var tag = a.tag ? '<span class="achievement-tag">' + escapeHtml(a.tag.toUpperCase()) + '</span>' : '';
            return '<div class="achievement-card" style="--achievement-color:' + escapeHtml(a.color || '#f9ca24') + ';">' +
                tag +
                '<div class="achievement-icon" style="background:' + escapeHtml(a.color || '#f9ca24') + ';"><i class="' + ic + '"></i></div>' +
                '<div class="achievement-year">' + escapeHtml(a.year || '2025') + '</div>' +
                '<h3>' + escapeHtml(a.title) + '</h3>' +
                '<p>' + escapeHtml(a.description) + '</p>' +
                '<span class="achievement-category">' + escapeHtml((a.category || 'milestone').toUpperCase()) + '</span>' +
            '</div>';
        }).join('');
        container.innerHTML = html;
    }

    function renderWhatsNew(updates) {
        var container = document.getElementById('whatsnewContainer') || document.querySelector('.whatsnew-timeline');
        if (!container) return;
        if (!updates || !updates.length) {
            container.innerHTML = '';
            return;
        }
        updates = dedupe(updates, 'title');
        updates.sort(function (a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });

        var html = updates.map(function (u) {
            var d = u.date ? new Date(u.date) : null;
            var dateStr = d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            return '<div class="whatsnew-item">' +
                '<div class="whatsnew-head">' +
                    '<span class="whatsnew-tag whatsnew-tag-' + escapeHtml(u.tag || 'UPDATE') + '">' + escapeHtml(u.tag || 'UPDATE') + '</span>' +
                    '<span class="whatsnew-date">' + dateStr + '</span>' +
                '</div>' +
                '<h3>' + escapeHtml(u.title) + '</h3>' +
                '<p>' + escapeHtml(u.description) + '</p>' +
                (u.link ? '<a href="' + escapeHtml(u.link) + '" target="_blank">Learn more →</a>' : '') +
            '</div>';
        }).join('');
        container.innerHTML = html;
    }

    function applySettings(settings) {
        if (!settings) return;
        var setText = function (selector, value) {
            if (!value) return;
            document.querySelectorAll(selector).forEach(function (el) { el.textContent = value; });
        };
        var setHref = function (selector, value) {
            if (!value) return;
            document.querySelectorAll(selector).forEach(function (el) { el.setAttribute('href', value); });
        };

        // Hero
        setText('[data-hero-name]', settings.hero_name);
        setText('[data-hero-tagline]', settings.hero_tagline);
        setText('[data-hero-subtitle]', settings.hero_subtitle);
        setText('[data-hero-cta-text]', settings.hero_cta_text);
        setHref('[data-hero-cta-link]', settings.hero_cta_link);

        // About
        setText('[data-about-title]', settings.about_title);
        setText('[data-about-description]', settings.about_description);
        setText('[data-about-years]', settings.about_years);
        setText('[data-about-projects]', settings.about_projects);
        setText('[data-about-clients]', settings.about_clients);
        setText('[data-about-satisfaction]', settings.about_satisfaction);

        // Contact
        setText('[data-contact-email]', settings.contact_email);
        setText('[data-contact-phone]', settings.contact_phone);
        setText('[data-contact-location]', settings.contact_location);
        if (settings.contact_email) setHref('[data-contact-email-link]', 'mailto:' + settings.contact_email);
        if (settings.contact_phone) setHref('[data-contact-phone-link]', 'tel:' + settings.contact_phone.replace(/\s/g, ''));
        if (settings.contact_whatsapp) setHref('[data-contact-whatsapp-link]', 'https://wa.me/' + settings.contact_whatsapp);

        // Social
        setHref('[data-social-github]', settings.social_github);
        setHref('[data-social-linkedin]', settings.social_linkedin);
        setHref('[data-social-youtube]', settings.social_youtube);
        setHref('[data-social-twitter]', settings.social_twitter);
        setHref('[data-social-instagram]', settings.social_instagram);
        setHref('[data-social-facebook]', settings.social_facebook);

        // Availability badge
        var availEl = document.querySelector('[data-availability]');
        if (availEl && settings.contact_availability) {
            availEl.className = availEl.className.replace(/availability-\w+/g, '');
            availEl.classList.add('availability-' + settings.contact_availability);
            var labels = { available: 'Available for Work', busy: 'Currently Busy', unavailable: 'Not Available' };
            availEl.textContent = labels[settings.contact_availability] || 'Available';
        }
    }

    // ===== RENDER ALL =====
    function renderAll(data) {
        if (data.settings) applySettings(data.settings);
        if (data.visibility) applyVisibility(data.visibility);
        if (data.projects) renderProjects(data.projects);
        if (data.testimonials) renderTestimonials(data.testimonials);
        if (data.skills) renderSkills(data.skills);
        if (data.services) renderServices(data.services);
        if (data.achievements) renderAchievements(data.achievements);
        if (data.whatsnew || data.updates) renderWhatsNew(data.whatsnew || data.updates);
    }

    // ===== FETCH =====
    function fetchData() {
        fetch(API_URL + '?action=getAllData')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok !== false) {
                    setCache(data);
                    renderAll(data);
                }
            })
            .catch(function (err) {
                console.warn('Portfolio data fetch failed:', err);
            });
    }

    // ===== INIT =====
    document.addEventListener('DOMContentLoaded', function () {
        // Show cached data first (instant)
        var cached = getCache();
        if (cached) {
            renderAll(cached);
            // Refresh in background after 2 sec
            setTimeout(fetchData, 2000);
        } else {
            fetchData();
        }

        // Track visit (analytics)
        try {
            var ua = navigator.userAgent;
            var device = /Mobile|Android|iPhone|iPad/.test(ua) ? 'mobile' : 'desktop';
            var browser = /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Other';
            var os = /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : /Android/.test(ua) ? 'Android' : 'Other';
            var session = sessionStorage.getItem('visitor_session');
            if (!session) {
                session = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
                sessionStorage.setItem('visitor_session', session);
            }
            var fd = new FormData();
            fd.append('action', 'trackVisit');
            fd.append('page', window.location.pathname);
            fd.append('device', device);
            fd.append('browser', browser);
            fd.append('os', os);
            fd.append('referrer', document.referrer || 'direct');
            fd.append('session', session);
            fetch(API_URL, { method: 'POST', body: fd }).catch(function () {});
        } catch (e) {}
    });

    // Expose for manual refresh
    window.HananPortfolio = {
        refresh: function () {
            try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
            fetchData();
        }
    };
})();
