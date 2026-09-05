/**
 * AucTech Vault — Navigation & search.
 * Depends on: shared state (view, filt), render functions (rDashboard,
 * rVault, rRenewals, rSocial, rSettings), renderList (vault.js),
 * closeDrawer (vault.js).
 */

function go(v) {
  view = v;
  sessionStorage.setItem('auctech_view', v);
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  render();
}

function doSearch(q) {
  filt.q = q;
  if (view !== 'vault' && q.trim()) go('vault');
  else if (view === 'vault') renderList();
}

function goCat(cat) {
  filt.cat    = cat;
  filt.client = null;
  filt.q      = '';
  const s = document.getElementById('globalSearch');
  if (s) s.value = '';
  go('vault');
}

function render() {
  const m = document.getElementById('main');
  if      (view === 'dashboard') m.innerHTML = rDashboard();
  else if (view === 'vault')   { m.innerHTML = rVault(); renderList(); }
  else if (view === 'renewals')  m.innerHTML = rRenewals();
  else if (view === 'social')    m.innerHTML = rSocial();
  else if (view === 'settings')  m.innerHTML = rSettings();
}

/* ---------------- keyboard shortcuts ---------------- */
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (!document.getElementById('app').classList.contains('on')) return;
    const s = document.getElementById('globalSearch');
    if (s) s.focus();
  }
  if (e.key === 'Escape') closeDrawer();
});
