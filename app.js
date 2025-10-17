
// Detectar online/offline y alternar vistas
const onlineView = document.getElementById('onlineView');
const offlineView = document.getElementById('offlineView');
function updateOnlineStatus(){
  const online = navigator.onLine;
  onlineView.classList.toggle('hidden', !online);
  offlineView.classList.toggle('hidden', online);
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// PWA: botón de instalar
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn?.addEventListener('click', async () => {
  installBtn.hidden = true;
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  }
});
