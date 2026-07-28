// DocWallet no longer uses the legacy PWA install prompt on the public web app.
// This file intentionally unregisters old service workers and clears old caches
// so users do not get stuck on stale versions of the site.

(async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }
  } catch (error) {
    console.warn('DocWallet cache cleanup skipped:', error);
  }
})();
