
(async function(){
  try {
    const res = await fetch('./assets/snapshot.html');
    if (!res.ok) throw new Error('No snapshot yet');
    const html = await res.text();
    const container = document.getElementById('snapshot');
    if (container) container.innerHTML = html;
  } catch(e) { console.warn(e); }
})();
