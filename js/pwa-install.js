// PWA Install Prompt Manager
(function() {
    let deferredPrompt = null;
    const DISMISS_KEY = 'pwa-install-dismissed';
    const DISMISS_DAYS = 7;

    function isDismissed() {
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (!dismissed) return false;
        const diffDays = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
        return diffDays < DISMISS_DAYS;
    }

    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
    }

    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    function createBanner() {
        const banner = document.createElement('div');
        banner.className = 'pwa-install-banner';
        banner.id = 'pwaInstallBanner';
        banner.setAttribute('role', 'alert');
        banner.innerHTML =
            '<div class="pwa-icon" aria-hidden="true">&#128241;</div>' +
            '<div class="pwa-text">' +
                '<p>Uygulamay\u0131 ana ekran\u0131na ekle</p>' +
                '<small>H\u0131zl\u0131 eri\u015fim i\u00e7in kur</small>' +
            '</div>' +
            '<button class="pwa-install-btn" id="pwaInstallBtn">Kur</button>' +
            '<button class="pwa-dismiss-btn" id="pwaDismissBtn" aria-label="Kapat">&times;</button>';
        document.body.appendChild(banner);
        return banner;
    }

    function createIOSModal() {
        var modal = document.createElement('div');
        modal.className = 'pwa-ios-modal';
        modal.id = 'pwaIOSModal';
        modal.innerHTML =
            '<div class="pwa-ios-content">' +
                '<h3>&#128241; Uygulamay\u0131 Kur</h3>' +
                '<p>Safari\'de alt men\u00fcdeki ' +
                '<strong>Payla\u015f</strong> butonuna bas\u0131n, ' +
                'sonra <strong>"Ana Ekrana Ekle"</strong> ' +
                'se\u00e7ene\u011fine dokunun.</p>' +
                '<button class="pwa-install-btn" onclick="document.getElementById(\'pwaIOSModal\').classList.remove(\'show\')">Anlad\u0131m</button>' +
            '</div>';
        document.body.appendChild(modal);
        return modal;
    }

    function init() {
        if (isStandalone() || isDismissed()) return;

        var banner = createBanner();

        // Android / Chrome
        window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            deferredPrompt = e;
            setTimeout(function() {
                banner.classList.add('show');
            }, 2000);
        });

        // Kur butonu
        document.getElementById('pwaInstallBtn').addEventListener('click', async function() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                var result = await deferredPrompt.userChoice;
                deferredPrompt = null;
                banner.classList.remove('show');
                if (typeof gtag === 'function') {
                    gtag('event', 'app_installed', { method: 'pwa_banner', outcome: result.outcome });
                }
            } else if (isIOS()) {
                var modal = document.getElementById('pwaIOSModal') || createIOSModal();
                modal.classList.add('show');
                banner.classList.remove('show');
            }
        });

        // Kapat butonu
        document.getElementById('pwaDismissBtn').addEventListener('click', function() {
            banner.classList.remove('show');
            localStorage.setItem(DISMISS_KEY, Date.now().toString());
        });

        // iOS icin beforeinstallprompt tetiklenmez
        if (isIOS()) {
            createIOSModal();
            setTimeout(function() {
                banner.classList.add('show');
            }, 3000);
        }

        // Uygulama kurulduysa
        window.addEventListener('appinstalled', function() {
            banner.classList.remove('show');
            deferredPrompt = null;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
