let deferredPrompt;
const installBtn = document.createElement('button');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Create install button
  installBtn.innerHTML = '📱 Instalar App';
  installBtn.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #6366F1, #4F46E5);
    color: white;
    border: none;
    padding: 16px 32px;
    border-radius: 50px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  installBtn.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      deferredPrompt = null;
      installBtn.remove();
    }
  };

  document.body.appendChild(installBtn);
});

window.addEventListener('appinstalled', () => {
  installBtn.remove();
  deferredPrompt = null;
  console.log('App installed successfully!');
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration.scope);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}