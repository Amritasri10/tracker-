/**
 * AucTech Vault — Navigation, search & sidebar toggle.
 * Depends on: shared state (view, filt), render functions (rDashboard,
 * rVault, rRenewals, rSocial, rSettings), renderList (vault.js),
 * closeDrawer (vault.js).
 */

function go(v) {
  view = v;
  sessionStorage.setItem('auctech_view', v);

  // highlight the correct sidebar tab
  document.querySelectorAll('.sidebar .tab').forEach(b =>
    b.classList.toggle('on', b.dataset.view === v)
  );

  // on mobile, close sidebar after navigation
  if (window.innerWidth < 769) closeSidebar();

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
  // after render, set the select value to match
  setTimeout(() => {
    const sel = document.getElementById('vaultCatSelect');
    if (sel && cat) sel.value = cat;
  }, 0);
}

function render() {
  const m = document.getElementById('main');
  if      (view === 'dashboard')  m.innerHTML = rDashboard();
  else if (view === 'vault')    { m.innerHTML = rVault(); renderList(); }
  else if (view === 'renewals')   m.innerHTML = rRenewals();
  else if (view === 'social')     m.innerHTML = rSocial();
  else if (view === 'categories') m.innerHTML = rCategories();
  else if (view === 'clients')    m.innerHTML = rClients();
  else if (view === 'settings')   m.innerHTML = rSettings();
}

/* ---------------- sidebar toggle (mobile) ---------------- */
function toggleSidebar() {
  const sb  = document.getElementById('sidebar');
  const ov  = document.getElementById('sbOverlay');
  if (!sb) return;
  const isOpen = sb.classList.contains('open');
  isOpen ? closeSidebar() : openSidebar();
}

function openSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sbOverlay');
  if (sb) sb.classList.add('open');
  if (ov) ov.classList.add('on');
}

function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sbOverlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('on');
}

/* ---------------- keyboard shortcuts ---------------- */
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (!document.getElementById('app').classList.contains('on')) return;
    const s = document.getElementById('globalSearch');
    if (s) s.focus();
  }
  if (e.key === 'Escape') {
    closeDrawer();
    closeSidebar();
  }
});
