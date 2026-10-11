(() => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      registration.update().catch(() => undefined);
    } catch (error) {
      console.warn("[DocWallet PWA] service worker not registered:", error);
    }
  });
})();
