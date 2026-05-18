/* =========================================================
   MOBILE ENHANCEMENTS - Sidebar, Touch, Performance
   ========================================================= */

(function () {
    'use strict';

    // ===== SIDEBAR BACKDROP =====
    // Auto-close sidebar when clicking outside on mobile

    $(document).ready(function () {

        // Add backdrop class to body when sidebar opens
        var $sidebar = $('#sidebar');
        if ($sidebar.length === 0) return;

        // Watch for sidebar open state
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName === 'class') {
                    if ($sidebar.hasClass('open')) {
                        $('body').addClass('sidebar-open');
                        // Lock body scroll
                        $('body').css('overflow', 'hidden');
                    } else {
                        $('body').removeClass('sidebar-open');
                        $('body').css('overflow', '');
                    }
                }
            });
        });

        observer.observe($sidebar[0], { attributes: true });

        // Close sidebar on backdrop click
        $(document).on('click', function (e) {
            if ($(window).width() <= 991 && $sidebar.hasClass('open')) {
                if (!$(e.target).closest('.sidebar, .sb-toggle').length) {
                    $sidebar.removeClass('open');
                }
            }
        });

        // Close sidebar on nav link click (mobile)
        $('.sb-nav a').on('click', function () {
            if ($(window).width() <= 991) {
                setTimeout(function () {
                    $sidebar.removeClass('open');
                }, 200);
            }
        });

        // Close sidebar on ESC
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && $sidebar.hasClass('open')) {
                $sidebar.removeClass('open');
            }
        });

        // ===== TOUCH SWIPE GESTURES =====
        // Swipe right from left edge to open sidebar
        // Swipe left to close
        var touchStartX = 0;
        var touchEndX = 0;
        var touchStartY = 0;
        var touchEndY = 0;

        $(document).on('touchstart', function (e) {
            touchStartX = e.originalEvent.touches[0].clientX;
            touchStartY = e.originalEvent.touches[0].clientY;
        });

        $(document).on('touchend', function (e) {
            touchEndX = e.originalEvent.changedTouches[0].clientX;
            touchEndY = e.originalEvent.changedTouches[0].clientY;

            handleSwipe();
        });

        function handleSwipe() {
            var diffX = touchEndX - touchStartX;
            var diffY = touchEndY - touchStartY;

            // Only handle horizontal swipes (ignore vertical)
            if (Math.abs(diffX) < Math.abs(diffY)) return;

            // Mobile only
            if ($(window).width() > 991) return;

            // Swipe right from left edge - open sidebar
            if (diffX > 60 && touchStartX < 30 && !$sidebar.hasClass('open')) {
                $sidebar.addClass('open');
            }

            // Swipe left when sidebar open - close
            if (diffX < -60 && $sidebar.hasClass('open')) {
                $sidebar.removeClass('open');
            }
        }

        // ===== PREVENT BODY SCROLL WHEN MODAL OPEN =====
        var bodyOriginalOverflow = '';

        function lockBody() {
            bodyOriginalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }

        function unlockBody() {
            document.body.style.overflow = bodyOriginalOverflow;
        }

        // Watch for modal open
        $(document).on('show.modal', function () { lockBody(); });
        $(document).on('hide.modal', function () { unlockBody(); });

        // Use mutation observer for modals
        var modalObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName === 'class') {
                    var $target = $(mutation.target);
                    if ($target.hasClass('modal')) {
                        if ($target.hasClass('show')) {
                            lockBody();
                        } else {
                            // Check if any modal still open
                            if ($('.modal.show').length === 0) {
                                unlockBody();
                            }
                        }
                    }
                }
            });
        });

        $('.modal').each(function () {
            modalObserver.observe(this, { attributes: true });
        });

        // ===== RESPONSIVE TABLE - CONVERT TO CARDS ON SMALL SCREENS =====
        // For visits table or similar wide tables
        function checkTableResponsive() {
            $('.visits-table').each(function () {
                if ($(window).width() <= 480) {
                    $(this).addClass('table-mobile');
                } else {
                    $(this).removeClass('table-mobile');
                }
            });
        }

        $(window).on('resize', checkTableResponsive);
        checkTableResponsive();

        // ===== VIBRATION FEEDBACK (if supported) =====
        function vibrate(duration) {
            if (navigator.vibrate) {
                navigator.vibrate(duration || 10);
            }
        }

        // Vibrate on important actions
        $(document).on('click', '.btn-save, .btn-danger', function () {
            vibrate(15);
        });

        // ===== PREVENT DOUBLE-TAP ZOOM ON BUTTONS =====
        $('button, .quick-link, .sb-nav a, .fb, .tf').css('touch-action', 'manipulation');

        // ===== FIX iOS INPUT ZOOM =====
        // Set input font-size to 16px to prevent iOS zoom
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            $('input, textarea, select').css('font-size', '16px');
        }

        // ===== VIEWPORT HEIGHT FIX =====
        // Fix 100vh on mobile (browser chrome accounting)
        function setVHVar() {
            var vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', vh + 'px');
        }

        setVHVar();
        $(window).on('resize orientationchange', setVHVar);

        // ===== FOCUS MANAGEMENT =====
        // Prevent focus on hidden sidebar links (mobile)
        function manageFocus() {
            if ($(window).width() <= 991 && !$sidebar.hasClass('open')) {
                $('.sb-nav a, .sb-logout').attr('tabindex', '-1');
            } else {
                $('.sb-nav a, .sb-logout').removeAttr('tabindex');
            }
        }

        $(window).on('resize', manageFocus);
        manageFocus();
    });

})();
