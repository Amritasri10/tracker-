/**
 * AucTech Vault — Login event handler & logout.
 * Depends on: shared state (D, userRole, view), helpers (toast),
 * role (applyRoleVisibility), navigation (go),
 * dataloader (loadCreds, loadAudit).
 */

/* ---------------- login event (fired by login.js) ---------------- */
window.addEventListener('auctech:login', async (ev) => {
  const user = ev.detail && ev.detail.user;
  userRole   = user ? user.role : null;
  document.getElementById('whoami').textContent = user ? (user.email || user.name || '') : '';
  applyRoleVisibility();
  toast('Loading your vault…');
  await Promise.all([loadCreds(), loadAudit()]);
  const savedView       = sessionStorage.getItem('auctech_view');
  const savedTab        = savedView && document.querySelector(`.tab[data-view="${savedView}"]`);
  const savedTabVisible = savedTab && savedTab.style.display !== 'none';
  go(savedTabVisible ? savedView : 'dashboard');
});

/* ---------------- logout ---------------- */
function manualLogout() {
  if (typeof window.logout === 'function') {
    window.logout();
  } else {
    document.getElementById('app').classList.remove('on');
    document.getElementById('lockScreen').style.display = 'flex';
  }
  D = { creds: [], audit: [] };
}
