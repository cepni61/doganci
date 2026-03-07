// Push Notification Manager
var PushNotifManager = (function() {
    var VAPID_PUBLIC_KEY = 'BHr5abc1EDSv1yj374cXdOxczpK0VnOaUsXF_wEnBSDCO5OOHA6wm1pVysUXa3RsoToNmL13VedIuJQkBBqIeVs';

    function urlBase64ToUint8Array(base64String) {
        var padding = '='.repeat((4 - base64String.length % 4) % 4);
        var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        var rawData = atob(base64);
        var outputArray = new Uint8Array(rawData.length);
        for (var i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async function subscribeToPush() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return false;
        }

        try {
            var registration = await navigator.serviceWorker.ready;
            var subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
            }

            var subJSON = subscription.toJSON();
            var response = await fetch(SUPABASE_URL + '/rest/v1/push_subscriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    endpoint: subJSON.endpoint,
                    p256dh: subJSON.keys.p256dh,
                    auth: subJSON.keys.auth,
                    user_agent: navigator.userAgent
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Push abonelik hatası:', error);
            return false;
        }
    }

    async function requestPermission() {
        if (!('Notification' in window)) return false;

        if (Notification.permission === 'granted') {
            return subscribeToPush();
        }

        if (Notification.permission === 'denied') {
            return false;
        }

        var permission = await Notification.requestPermission();
        if (permission === 'granted') {
            return subscribeToPush();
        }
        return false;
    }

    function initSmartPrompt() {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'default') {
            // Zaten izin verilmişse sessizce abone ol
            if (Notification.permission === 'granted') {
                subscribeToPush();
            }
            return;
        }

        var VISIT_KEY = 'push-visit-count';
        var ASKED_KEY = 'push-permission-asked';

        if (localStorage.getItem(ASKED_KEY)) return;

        var visits = parseInt(localStorage.getItem(VISIT_KEY) || '0') + 1;
        localStorage.setItem(VISIT_KEY, visits.toString());

        // 3. ziyaretten sonra sor
        if (visits >= 3) {
            setTimeout(function() {
                if (confirm('Yeni haberler ve duyurulardan haberdar olmak ister misiniz?')) {
                    requestPermission();
                }
                localStorage.setItem(ASKED_KEY, 'true');
            }, 5000);
        }
    }

    return {
        requestPermission: requestPermission,
        subscribeToPush: subscribeToPush,
        initSmartPrompt: initSmartPrompt
    };
})();

// Sayfa yüklendiğinde akıllı istem başlat
window.addEventListener('load', function() {
    PushNotifManager.initSmartPrompt();
});

// Uygulama kurulduğunda izin iste
window.addEventListener('appinstalled', function() {
    setTimeout(function() {
        PushNotifManager.requestPermission();
    }, 2000);
});
