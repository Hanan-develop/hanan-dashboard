/* =========================================================
   POWER FEATURES - Notifications, Command Palette, Shortcuts
   ========================================================= */

(function () {
    'use strict';

    // ===== NOTIFICATION SYSTEM =====

    var NOTIF_STORAGE_KEY = 'hanan_notifications';
    var notifications = [];

    function loadNotifications() {
        try {
            var stored = localStorage.getItem(NOTIF_STORAGE_KEY);
            notifications = stored ? JSON.parse(stored) : [];
        } catch (e) { notifications = []; }
    }

    function saveNotifications() {
        try {
            // Keep only last 20
            if (notifications.length > 20) {
                notifications = notifications.slice(0, 20);
            }
            localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
        } catch (e) { }
    }

    function ensureNotifContainer() {
        if ($('#notifContainer').length === 0) {
            $('body').append('<div class="notif-container" id="notifContainer"></div>');
        }
    }

    /**
     * Show toast notification
     * @param {object} opts - {title, message, type: 'success'|'error'|'info'|'warning', duration, persist}
     */
    window.notify = function (opts) {
        if (typeof opts === 'string') {
            opts = { message: opts };
        }
        opts = opts || {};
        var type = opts.type || 'info';
        var title = opts.title;
        var message = opts.message || '';
        var duration = opts.duration || 4000;
        var persist = opts.persist === true; // Save to panel

        ensureNotifContainer();

        var icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-exclamation',
            info: 'fa-circle-info',
            warning: 'fa-triangle-exclamation'
        };
        var icon = icons[type] || icons.info;

        var titleHtml = title ? '<div class="notif-title">' + escapeHtml(title) + '</div>' : '';
        var messageHtml = '<div class="notif-message">' + escapeHtml(message) + '</div>';

        var $notif = $(
            '<div class="notif ' + type + '">' +
                '<div class="notif-icon"><i class="fa-solid ' + icon + '"></i></div>' +
                '<div class="notif-content">' + titleHtml + messageHtml + '</div>' +
                '<button class="notif-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>' +
                '<div class="notif-progress"><div class="notif-progress-bar" style="animation-duration:' + duration + 'ms;"></div></div>' +
            '</div>'
        );

        $('#notifContainer').append($notif);

        setTimeout(function () { $notif.addClass('show'); }, 50);

        var hideTimer = setTimeout(function () {
            hideNotif($notif);
        }, duration);

        $notif.find('.notif-close').on('click', function () {
            clearTimeout(hideTimer);
            hideNotif($notif);
        });

        // Save to history if persist
        if (persist) {
            notifications.unshift({
                id: 'n_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                type: type,
                title: title,
                message: message,
                timestamp: Date.now(),
                read: false
            });
            saveNotifications();
            updateBellBadge();
        }
    };

    function hideNotif($el) {
        $el.removeClass('show');
        setTimeout(function () { $el.remove(); }, 400);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatRelTime(ts) {
        var diff = Date.now() - ts;
        var mins = Math.floor(diff / 60000);
        var hrs = Math.floor(diff / 3600000);
        var days = Math.floor(diff / 86400000);

        if (mins < 1) return 'Just now';
        if (mins < 60) return mins + 'm ago';
        if (hrs < 24) return hrs + 'h ago';
        if (days < 7) return days + 'd ago';
        return new Date(ts).toLocaleDateString();
    }

    // ===== NOTIFICATION BELL =====

    function buildBellButton() {
        if ($('.notif-bell-btn').length > 0) return;

        var bellHtml =
            '<div class="notif-bell-wrap">' +
                '<button class="notif-bell-btn" id="notifBellBtn" title="Notifications" aria-label="Notifications">' +
                    '<i class="fa-solid fa-bell"></i>' +
                    '<span class="notif-bell-badge" id="notifBellBadge" style="display:none;">0</span>' +
                '</button>' +
                '<div class="notif-panel" id="notifPanel"></div>' +
            '</div>';

        // Insert before theme toggle in topbar
        var $themeToggle = $('.theme-toggle').first();
        if ($themeToggle.length) {
            $themeToggle.before(bellHtml);
        } else {
            $('.topbar-actions').prepend(bellHtml);
        }

        renderNotifPanel();
        updateBellBadge();

        // Toggle panel
        $('#notifBellBtn').on('click', function (e) {
            e.stopPropagation();
            $('#notifPanel').toggleClass('show');
        });

        // Close on outside click
        $(document).on('click', function (e) {
            if (!$(e.target).closest('.notif-bell-wrap').length) {
                $('#notifPanel').removeClass('show');
            }
        });
    }

    function updateBellBadge() {
        var unread = notifications.filter(function (n) { return !n.read; }).length;
        var $badge = $('#notifBellBadge');
        if (unread > 0) {
            $badge.text(unread > 9 ? '9+' : unread).show();
        } else {
            $badge.hide();
        }
    }

    function renderNotifPanel() {
        var headHtml =
            '<div class="notif-panel-head">' +
                '<h3>Notifications</h3>' +
                (notifications.length > 0 ? '<button class="notif-clear" id="clearNotifs">Clear all</button>' : '') +
            '</div>';

        var listHtml;
        if (notifications.length === 0) {
            listHtml =
                '<div class="notif-panel-empty">' +
                    '<i class="fa-solid fa-bell-slash"></i>' +
                    '<p>No notifications yet</p>' +
                '</div>';
        } else {
            var icons = {
                success: 'fa-circle-check',
                error: 'fa-circle-exclamation',
                info: 'fa-circle-info',
                warning: 'fa-triangle-exclamation'
            };

            listHtml = '<div class="notif-panel-list">' +
                notifications.map(function (n) {
                    var icon = icons[n.type] || icons.info;
                    return (
                        '<div class="notif-panel-item ' + (n.read ? '' : 'unread') + '" data-id="' + n.id + '">' +
                            '<div class="notif-icon ' + n.type + '"><i class="fa-solid ' + icon + '" style="color: var(--' + (n.type === 'error' ? 'error' : n.type === 'success' ? 'success' : 'yellow') + ');"></i></div>' +
                            '<div class="notif-content">' +
                                (n.title ? '<div class="notif-title">' + escapeHtml(n.title) + '</div>' : '') +
                                '<div class="notif-message">' + escapeHtml(n.message) + '</div>' +
                                '<div style="font-size:1.1rem;color:var(--text-muted);margin-top:0.4rem;">' + formatRelTime(n.timestamp) + '</div>' +
                            '</div>' +
                        '</div>'
                    );
                }).join('') +
            '</div>';
        }

        $('#notifPanel').html(headHtml + listHtml);

        $('#clearNotifs').on('click', function () {
            notifications = [];
            saveNotifications();
            renderNotifPanel();
            updateBellBadge();
            notify({ message: 'Notifications cleared', type: 'success' });
        });

        $('.notif-panel-item').on('click', function () {
            var id = $(this).data('id');
            var notif = notifications.find(function (n) { return n.id === id; });
            if (notif) {
                notif.read = true;
                saveNotifications();
                $(this).removeClass('unread');
                updateBellBadge();
            }
        });
    }

    // ===== COMMAND PALETTE =====

    var COMMANDS = [
        // Navigation
        { id: 'nav_dashboard', title: 'Dashboard', desc: 'Go to dashboard home', icon: 'fa-gauge-high', action: 'nav', target: 'dashboard.html', group: 'Navigation', keywords: 'home main' },
        { id: 'nav_messages', title: 'Messages', desc: 'View contact form messages', icon: 'fa-envelope', action: 'nav', target: 'messages.html', group: 'Navigation', keywords: 'inbox mail contact' },
        { id: 'nav_analytics', title: 'Analytics', desc: 'View visitor analytics', icon: 'fa-chart-line', action: 'nav', target: 'analytics.html', group: 'Navigation', keywords: 'stats visitors traffic' },
        { id: 'nav_projects', title: 'Projects', desc: 'Manage portfolio projects', icon: 'fa-folder-open', action: 'nav', target: 'projects.html', group: 'Navigation', keywords: 'portfolio work' },
        { id: 'nav_testimonials', title: 'Testimonials', desc: 'Manage client testimonials', icon: 'fa-star', action: 'nav', target: 'testimonials.html', group: 'Navigation', keywords: 'reviews clients feedback' },
        { id: 'nav_settings', title: 'Settings', desc: 'Change password & preferences', icon: 'fa-gear', action: 'nav', target: 'settings.html', group: 'Navigation', keywords: 'config preferences password' },

        // Actions
        { id: 'act_theme', title: 'Toggle Theme', desc: 'Switch between dark and light mode', icon: 'fa-circle-half-stroke', action: 'theme', group: 'Actions', shortcut: 'T', keywords: 'dark light mode' },
        { id: 'act_refresh', title: 'Refresh Data', desc: 'Reload current page data', icon: 'fa-arrows-rotate', action: 'refresh', group: 'Actions', shortcut: 'R', keywords: 'reload sync update' },
        { id: 'act_shortcuts', title: 'Keyboard Shortcuts', desc: 'View all shortcuts', icon: 'fa-keyboard', action: 'shortcuts', group: 'Actions', shortcut: '?', keywords: 'keys help hotkeys' },
        { id: 'act_logout', title: 'Logout', desc: 'Sign out of dashboard', icon: 'fa-right-from-bracket', action: 'logout', group: 'Actions', keywords: 'signout exit' },

        // External
        { id: 'ext_portfolio', title: 'View Portfolio', desc: 'Open live portfolio site', icon: 'fa-globe', action: 'external', target: 'https://hanan-develop.github.io/hanan-portfolio/', group: 'External', keywords: 'site website live' },
        { id: 'ext_sheets', title: 'Google Sheets', desc: 'Open data spreadsheet', icon: 'fa-table', action: 'external', target: 'https://docs.google.com/spreadsheets', group: 'External', keywords: 'data backend' },
        { id: 'ext_github_portfolio', title: 'Portfolio Repo', desc: 'GitHub portfolio source', icon: 'fa-brands fa-github', action: 'external', target: 'https://github.com/Hanan-develop/hanan-portfolio', group: 'External', keywords: 'git code source' },
        { id: 'ext_github_dashboard', title: 'Dashboard Repo', desc: 'GitHub dashboard source', icon: 'fa-brands fa-github', action: 'external', target: 'https://github.com/Hanan-develop/hanan-dashboard', group: 'External', keywords: 'git code source admin' }
    ];

    var cmdSelectedIndex = 0;
    var cmdFilteredResults = [];

    function buildCommandPalette() {
        if ($('#cmdPaletteOverlay').length > 0) return;

        var html =
            '<div class="cmd-palette-overlay" id="cmdPaletteOverlay">' +
                '<div class="cmd-palette" role="dialog" aria-modal="true">' +
                    '<div class="cmd-search-wrap">' +
                        '<i class="fa-solid fa-magnifying-glass cmd-search-icon"></i>' +
                        '<input type="text" class="cmd-search-input" id="cmdSearchInput" placeholder="Search commands or jump to page..." autocomplete="off" />' +
                        '<span class="cmd-kbd">ESC</span>' +
                    '</div>' +
                    '<div class="cmd-results" id="cmdResults"></div>' +
                    '<div class="cmd-footer">' +
                        '<div class="cmd-footer-hints">' +
                            '<span class="cmd-footer-hint"><span class="cmd-kbd">↑↓</span> Navigate</span>' +
                            '<span class="cmd-footer-hint"><span class="cmd-kbd">↵</span> Select</span>' +
                            '<span class="cmd-footer-hint"><span class="cmd-kbd">ESC</span> Close</span>' +
                        '</div>' +
                        '<span style="color: var(--yellow); font-weight: 700;">Cmd+K</span>' +
                    '</div>' +
                '</div>' +
            '</div>';

        $('body').append(html);

        renderCmdResults('');

        $('#cmdSearchInput').on('input', function () {
            cmdSelectedIndex = 0;
            renderCmdResults($(this).val());
        });

        $('#cmdPaletteOverlay').on('click', function (e) {
            if (e.target === this) closeCmdPalette();
        });

        $('#cmdPaletteOverlay').on('keydown', function (e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                cmdSelectedIndex = Math.min(cmdSelectedIndex + 1, cmdFilteredResults.length - 1);
                updateCmdSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                cmdSelectedIndex = Math.max(cmdSelectedIndex - 1, 0);
                updateCmdSelection();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                executeCommand(cmdFilteredResults[cmdSelectedIndex]);
            } else if (e.key === 'Escape') {
                closeCmdPalette();
            }
        });

        $(document).on('click', '.cmd-item[data-cmd]', function () {
            var id = $(this).data('cmd');
            var cmd = COMMANDS.find(function (c) { return c.id === id; });
            if (cmd) executeCommand(cmd);
        });
    }

    function renderCmdResults(query) {
        query = (query || '').toLowerCase().trim();

        if (query) {
            cmdFilteredResults = COMMANDS.filter(function (c) {
                var haystack = (c.title + ' ' + c.desc + ' ' + (c.keywords || '')).toLowerCase();
                return haystack.indexOf(query) > -1;
            });
        } else {
            cmdFilteredResults = COMMANDS.slice();
        }

        if (cmdFilteredResults.length === 0) {
            $('#cmdResults').html(
                '<div class="cmd-empty">' +
                    '<i class="fa-solid fa-magnifying-glass"></i>' +
                    '<p>No results for "' + escapeHtml(query) + '"</p>' +
                '</div>'
            );
            return;
        }

        // Group by group
        var groups = {};
        cmdFilteredResults.forEach(function (c) {
            var g = c.group || 'Other';
            if (!groups[g]) groups[g] = [];
            groups[g].push(c);
        });

        var html = '';
        var globalIdx = 0;
        Object.keys(groups).forEach(function (groupName) {
            html += '<div class="cmd-section-title">' + escapeHtml(groupName) + '</div>';
            groups[groupName].forEach(function (cmd) {
                var iconClass = cmd.icon.indexOf('fa-brands') === 0 ? cmd.icon : 'fa-solid ' + cmd.icon;
                var shortcutHtml = cmd.shortcut ? '<span class="cmd-item-shortcut">' + escapeHtml(cmd.shortcut) + '</span>' : '';

                html += (
                    '<div class="cmd-item ' + (globalIdx === cmdSelectedIndex ? 'active' : '') + '" data-cmd="' + cmd.id + '" data-idx="' + globalIdx + '">' +
                        '<div class="cmd-item-icon"><i class="' + iconClass + '"></i></div>' +
                        '<div class="cmd-item-content">' +
                            '<div class="cmd-item-title">' + escapeHtml(cmd.title) + '</div>' +
                            '<div class="cmd-item-desc">' + escapeHtml(cmd.desc) + '</div>' +
                        '</div>' +
                        shortcutHtml +
                    '</div>'
                );
                globalIdx++;
            });
        });

        $('#cmdResults').html(html);
    }

    function updateCmdSelection() {
        $('.cmd-item').removeClass('active');
        $('.cmd-item[data-idx="' + cmdSelectedIndex + '"]').addClass('active');

        // Scroll to active
        var $active = $('.cmd-item.active');
        if ($active.length) {
            var $results = $('#cmdResults');
            var resultsTop = $results.scrollTop();
            var resultsBottom = resultsTop + $results.height();
            var elemTop = $active.position().top + resultsTop;
            var elemBottom = elemTop + $active.outerHeight();

            if (elemTop < resultsTop) {
                $results.scrollTop(elemTop - 20);
            } else if (elemBottom > resultsBottom) {
                $results.scrollTop(elemBottom - $results.height() + 20);
            }
        }
    }

    function executeCommand(cmd) {
        if (!cmd) return;
        closeCmdPalette();

        setTimeout(function () {
            if (cmd.action === 'nav') {
                window.location.href = cmd.target;
            } else if (cmd.action === 'external') {
                window.open(cmd.target, '_blank');
            } else if (cmd.action === 'theme') {
                if (window.HananTheme) HananTheme.toggle();
            } else if (cmd.action === 'refresh') {
                var $btn = $('#refreshBtn');
                if ($btn.length) $btn.click();
                else location.reload();
            } else if (cmd.action === 'shortcuts') {
                openShortcutsModal();
            } else if (cmd.action === 'logout') {
                if (confirm('Logout?') && window.HananAuth) HananAuth.logout();
            }
        }, 100);
    }

    function openCmdPalette() {
        buildCommandPalette();
        $('#cmdPaletteOverlay').addClass('show');
        $('#cmdSearchInput').val('').focus();
        cmdSelectedIndex = 0;
        renderCmdResults('');
    }

    function closeCmdPalette() {
        $('#cmdPaletteOverlay').removeClass('show');
    }

    // ===== KEYBOARD SHORTCUTS MODAL =====

    function openShortcutsModal() {
        if ($('#shortcutsModal').length > 0) {
            $('#shortcutsModal').addClass('show');
            return;
        }

        var html =
            '<div class="modal" id="shortcutsModal">' +
                '<div class="modal-backdrop" data-close-shortcuts></div>' +
                '<div class="modal-card shortcuts-modal">' +
                    '<button class="modal-close" data-close-shortcuts><i class="fa-solid fa-xmark"></i></button>' +
                    '<div class="modal-body">' +
                        '<h2 class="shortcuts-header">Keyboard Shortcuts</h2>' +
                        '<p class="shortcuts-subtitle">Master the dashboard with these shortcuts</p>' +
                        '<div class="shortcuts-list">' +

                            '<div class="shortcut-group-title">General</div>' +
                            '<div class="shortcut-row">' +
                                '<span class="shortcut-label">Open command palette</span>' +
                                '<div class="shortcut-keys"><span class="cmd-kbd">Ctrl</span><span class="shortcut-plus">+</span><span class="cmd-kbd">K</span></div>' +
                            '</div>' +
                            '<div class="shortcut-row">' +
                                '<span class="shortcut-label">Toggle dark/light theme</span>' +
                                '<div class="shortcut-keys"><span class="cmd-kbd">T</span></div>' +
                            '</div>' +
                            '<div class="shortcut-row">' +
                                '<span class="shortcut-label">Show this shortcuts panel</span>' +
                                '<div class="shortcut-keys"><span class="cmd-kbd">?</span></div>' +
                            '</div>' +
                            '<div class="shortcut-row">' +
                                '<span class="shortcut-label">Refresh data</span>' +
                                '<div class="shortcut-keys"><span class="cmd-kbd">R</span></div>' +
                            '</div>' +
                            '<div class="shortcut-row">' +
                                '<span class="shortcut-label">Close modal / panel</span>' +
                                '<div class="shortcut-keys"><span class="cmd-kbd">ESC</span></div>' +
                            '</div>' +

                            '<div class="shortcut-group-title">Navigation</div>' +
                            '<div class="shortcut-row">' +
                                '<span class="shortcut-label">Go to Dashboard</span>' +
                                '<div class="shortcut-keys"><span class="cmd-kbd">G</span><span class="shortcut-plus">→</span><span class="cmd-kbd">D</span></div>' +
                            '</div>' +
                            '<div class="shortcut-row">' +
                                '<span class="shortcut-label">Go to Messages</span>' +
                                '<div class="shortcut-keys"><span class="cmd-kbd">G</span><span class="shortcut-plus">→</span><span class="cmd-kbd">M</span></div>' +
                            '</div>' +
                            '<div class="shortcut-row">' +
                                '<span class="shortcut-label">Go to Analytics</span>' +
                                '<div class="shortcut-keys"><span class="cmd-kbd">G</span><span class="shortcut-plus">→</span><span class="cmd-kbd">A</span></div>' +
                            '</div>' +
                            '<div class="shortcut-row">' +
                                '<span class="shortcut-label">Go to Projects</span>' +
                                '<div class="shortcut-keys"><span class="cmd-kbd">G</span><span class="shortcut-plus">→</span><span class="cmd-kbd">P</span></div>' +
                            '</div>' +
                            '<div class="shortcut-row">' +
                                '<span class="shortcut-label">Go to Settings</span>' +
                                '<div class="shortcut-keys"><span class="cmd-kbd">G</span><span class="shortcut-plus">→</span><span class="cmd-kbd">S</span></div>' +
                            '</div>' +

                            '<div class="shortcut-group-title">Command Palette</div>' +
                            '<div class="shortcut-row">' +
                                '<span class="shortcut-label">Navigate up/down</span>' +
                                '<div class="shortcut-keys"><span class="cmd-kbd">↑</span><span class="cmd-kbd">↓</span></div>' +
                            '</div>' +
                            '<div class="shortcut-row">' +
                                '<span class="shortcut-label">Select item</span>' +
                                '<div class="shortcut-keys"><span class="cmd-kbd">↵</span></div>' +
                            '</div>' +

                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        $('body').append(html);
        setTimeout(function () { $('#shortcutsModal').addClass('show'); }, 10);

        $('#shortcutsModal').on('click', '[data-close-shortcuts]', function () {
            $('#shortcutsModal').removeClass('show');
            setTimeout(function () { $('#shortcutsModal').remove(); }, 300);
        });
    }

    // ===== KEYBOARD SHORTCUTS =====

    var lastKey = null;
    var lastKeyTime = 0;

    function isInputFocused() {
        var tag = (document.activeElement.tagName || '').toLowerCase();
        return tag === 'input' || tag === 'textarea' || document.activeElement.isContentEditable;
    }

    $(document).on('keydown', function (e) {

        // Ctrl/Cmd + K → Open command palette (always works)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openCmdPalette();
            return;
        }

        // Skip other shortcuts if typing
        if (isInputFocused()) return;

        // ESC → Close modals
        if (e.key === 'Escape') {
            $('.cmd-palette-overlay').removeClass('show');
            $('#shortcutsModal').removeClass('show');
            $('#notifPanel').removeClass('show');
            return;
        }

        // ? → Show shortcuts
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
            e.preventDefault();
            openShortcutsModal();
            return;
        }

        // T → Toggle theme (handled by theme.js but we also handle here)
        // R → Refresh
        if (e.key === 'r' || e.key === 'R') {
            if (!e.ctrlKey && !e.metaKey) {
                var $btn = $('#refreshBtn');
                if ($btn.length) {
                    e.preventDefault();
                    $btn.click();
                }
            }
            return;
        }

        // G then [letter] → Navigate
        if (e.key === 'g' || e.key === 'G') {
            lastKey = 'g';
            lastKeyTime = Date.now();
            return;
        }

        // Check for G+letter combo (within 1 second)
        if (lastKey === 'g' && Date.now() - lastKeyTime < 1000) {
            var navMap = {
                'd': 'dashboard.html',
                'm': 'messages.html',
                'a': 'analytics.html',
                'p': 'projects.html',
                't': 'testimonials.html',
                's': 'settings.html'
            };
            var target = navMap[e.key.toLowerCase()];
            if (target) {
                e.preventDefault();
                lastKey = null;
                window.location.href = target;
                return;
            }
        }

        // Reset
        if (e.key !== 'g' && e.key !== 'G') {
            lastKey = null;
        }
    });

    // ===== INIT =====

    $(document).ready(function () {
        loadNotifications();

        // Only build bell on pages with topbar (not login)
        if ($('.topbar-actions').length > 0) {
            buildBellButton();
        }

        // Open command palette via topbar button
        $(document).on('click', '#cmdPaletteBtn', function () {
            openCmdPalette();
        });
    });

    // Export
    window.HananFeatures = {
        notify: window.notify,
        openCmdPalette: openCmdPalette,
        openShortcutsModal: openShortcutsModal,
        addNotification: function (n) {
            notifications.unshift({
                id: 'n_' + Date.now(),
                type: n.type || 'info',
                title: n.title,
                message: n.message,
                timestamp: Date.now(),
                read: false
            });
            saveNotifications();
            renderNotifPanel();
            updateBellBadge();
        }
    };

})();
