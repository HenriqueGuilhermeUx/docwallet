let deferredPrompt;
const installBtn = document.createElement('button');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  installBtn.innerHTML = '📱 Instalar App';
  installBtn.style.cssText = `
    position: fixed;
    right: 20px;
    bottom: 20px;
    background: linear-gradient(135deg, #6366F1, #4F46E5);
    color: white;
    border: none;
    padding: 12px 18px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(99,102,241,0.35);
    z-index: 9999;
  `;

  installBtn.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.remove();
    }
  };

  if (!document.body.contains(installBtn)) {
    document.body.appendChild(installBtn);
  }
});

window.addEventListener('appinstalled', () => {
  installBtn.remove();
  deferredPrompt = null;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
