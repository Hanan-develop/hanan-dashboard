/* HANAN DASHBOARD - AUTH */
(function () {
    'use strict';
    var API_URL = 'https://script.google.com/macros/s/AKfycbx2sQwvMTOCeNdiE255oLaoqXUHvdsKrcn423nUIqrwqRtcWTdUL6LPm9VJjVz4M6dE/exec';
    var SECRET_KEY = 'hanan_2026_secret';
    var STORAGE_KEY = 'hanan_dashboard_auth';

    window.HananAuth = {
        getApiUrl: function () { return API_URL; },
        getSecret: function () { return SECRET_KEY; },
        isLoggedIn: function () {
            try {
                var auth = JSON.parse(localStorage.getItem(STORAGE_KEY));
                if (!auth || !auth.username || !auth.timestamp) return false;
                return (Date.now() - auth.timestamp) < (30 * 24 * 60 * 60 * 1000);
            } catch (e) { return false; }
        },
        getCurrentUser: function () {
            try {
                var auth = JSON.parse(localStorage.getItem(STORAGE_KEY));
                return auth ? auth.username : null;
            } catch (e) { return null; }
        },
        login: function (username) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ username: username, timestamp: Date.now() }));
        },
        logout: function () {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('hanan_dashboard_cache');
            window.location.href = 'index.html';
        },
        requireAuth: function () {
            if (!this.isLoggedIn()) { window.location.href = 'index.html'; return false; }
            return true;
        }
    };
})();
