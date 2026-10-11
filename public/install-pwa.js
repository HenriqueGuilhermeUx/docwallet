(() => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("[DocWallet PWA] service worker não registrado:", error);
    });
  });

  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    window.dispatchEvent(new CustomEvent("docwallet:pwa-install-available"));
  });

  window.DocWalletPWA = {
    canInstall() {
      return Boolean(deferredPrompt);
    },
    async install() {
      if (!deferredPrompt) return { outcome: "unavailable" };
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      return choice;
    }
  };
})();
